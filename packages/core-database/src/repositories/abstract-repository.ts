import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";

import { QueryHelper } from "../utils/query-helper";

export abstract class AbstractRepository<TEntity extends ObjectLiteral> extends Repository<TEntity> {
    private readonly queryHelper = new QueryHelper<TEntity>();

    public async findById(id: string): Promise<TEntity> {
        return (await this.findByIds([id]))[0];
    }

    public async findOneByExpression(expression: Contracts.Search.Expression<TEntity>): Promise<TEntity | undefined> {
        const queryBuilder: SelectQueryBuilder<TEntity> = this.createQueryBuilder().select();
        const sqlExpression = this.queryHelper.getWhereExpressionSql(this.metadata, expression);
        queryBuilder.where(sqlExpression.query, sqlExpression.parameters);
        return queryBuilder.getOne();
    }

    public async findManyByExpression(expression: Contracts.Search.Expression<TEntity>): Promise<TEntity[]> {
        const queryBuilder: SelectQueryBuilder<TEntity> = this.createQueryBuilder().select();
        const sqlExpression = this.queryHelper.getWhereExpressionSql(this.metadata, expression);
        queryBuilder.where(sqlExpression.query, sqlExpression.parameters);
        return queryBuilder.getMany();
    }

    public async listByExpression(
        expression: Contracts.Search.Expression<TEntity>,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<TEntity>> {
        const queryBuilder = this.createQueryBuilder().select().skip(page.offset).take(page.limit);

        const sqlExpression = this.queryHelper.getWhereExpressionSql(this.metadata, expression);
        queryBuilder.where(sqlExpression.query, sqlExpression.parameters);

        if (order.length) {
            const column = this.queryHelper.getColumnName(this.metadata, order[0].property);
            queryBuilder.orderBy(column, order[0].direction === "desc" ? "DESC" : "ASC");

            for (const item of order.slice(1)) {
                const column = this.queryHelper.getColumnName(this.metadata, item.property);
                queryBuilder.addOrderBy(column, item.direction === "desc" ? "DESC" : "ASC");
            }
        }

        if (options?.estimateTotalCount === false) {
            const [rows, count]: [TEntity[], number] = await queryBuilder.getManyAndCount();
            return { rows, count, countIsEstimate: false };
        } else {
            const rows = await queryBuilder.getMany();

            let count = 0;
            const [query, parameters] = queryBuilder.getQueryAndParameters();
            const explainedQuery = await this.query(`EXPLAIN ${query}`, parameters);
            for (const row of explainedQuery) {
                const match = row["QUERY PLAN"].match(/rows=([0-9]+)/);
                if (match) {
                    count = parseFloat(match[1]);
                }
            }

            return { rows, count: Math.max(count, rows.length), countIsEstimate: true };
        }
    }

    protected rawToEntity(
        rawEntity: Record<string, any>,
        customPropertyHandler: (entity: { [P in keyof TEntity]?: TEntity[P] }, key: string, value: any) => void,
    ): TEntity {
        const entity: TEntity = this.create();
        for (const [key, value] of Object.entries(rawEntity)) {
            // Replace auto-generated column name with property name, if any.
            const columnName: string = key.replace(`${this.metadata.givenTableName}_`, "");
            const columnMetadata: ColumnMetadata | undefined = this.metadata.columns.find(
                (column) => column.databaseName === columnName,
            );

            if (columnMetadata) {
                let propertyValue: any;

                if (value === undefined || value === null) {
                    propertyValue = undefined;
                } else if (columnMetadata.type === "bigint") {
                    propertyValue = Utils.BigNumber.make(value);
                } else if (columnMetadata.propertyName === "vendorField") {
                    propertyValue = value.toString("utf8");
                } else {
                    propertyValue = value;
                }

                entity[columnMetadata.propertyName as keyof TEntity] = propertyValue;
            } else {
                customPropertyHandler(entity, key, value);
            }
        }

        return entity;
    }
}
