import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";

import { QueryHelper } from "../utils/query-helper";

export type CustomPropertyHandler<TEntity> = (entity: Partial<TEntity>, key: string, value: unknown) => void;

export abstract class AbstractRepository<TEntity extends ObjectLiteral> extends Repository<TEntity> {
    private readonly queryHelper = new QueryHelper<TEntity>();

    public async findById(id: string): Promise<TEntity> {
        return (await this.findByIds([id]))[0];
    }

    public async findManyByExpression(
        expression: Contracts.Search.Expression<TEntity>,
        order: Contracts.Search.ListOrder = [],
    ): Promise<TEntity[]> {
        const queryBuilder: SelectQueryBuilder<TEntity> = this.createQueryBuilder().select();
        this.addWhere(queryBuilder, expression);
        this.addOrderBy(queryBuilder, order);
        return queryBuilder.getMany();
    }

    public async *streamByExpression(
        expression: Contracts.Search.Expression<TEntity>,
        order: Contracts.Search.ListOrder = [],
    ): AsyncIterable<TEntity> {
        const queryBuilder = this.createQueryBuilder().select("*");
        this.addWhere(queryBuilder, expression);
        this.addOrderBy(queryBuilder, order);
        const stream = await queryBuilder.stream();

        for await (const raw of stream) {
            yield this.rawToEntity(raw);
        }
    }

    public async listByExpression(
        expression: Contracts.Search.Expression<TEntity>,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<TEntity>> {
        const queryBuilder = this.createQueryBuilder().select();
        this.addWhere(queryBuilder, expression);
        this.addOrderBy(queryBuilder, order);
        this.addSkipOffset(queryBuilder, page);

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
        customPropertyHandler?: CustomPropertyHandler<TEntity>,
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
                Utils.assert.defined<CustomPropertyHandler<TEntity>>(customPropertyHandler);
                customPropertyHandler(entity, key, value);
            }
        }

        return entity;
    }

    private addWhere(
        queryBuilder: SelectQueryBuilder<TEntity>,
        expression: Contracts.Search.Expression<TEntity>,
    ): void {
        const sqlExpression = this.queryHelper.getWhereExpressionSql(this.metadata, expression);
        queryBuilder.where(sqlExpression.query, sqlExpression.parameters);
    }

    private addOrderBy(queryBuilder: SelectQueryBuilder<TEntity>, order: Contracts.Search.ListOrder): void {
        if (order.length) {
            const column = this.queryHelper.getColumnName(this.metadata, order[0].property);
            queryBuilder.orderBy(column, order[0].direction === "desc" ? "DESC" : "ASC");

            for (const item of order.slice(1)) {
                const column = this.queryHelper.getColumnName(this.metadata, item.property);
                queryBuilder.addOrderBy(column, item.direction === "desc" ? "DESC" : "ASC");
            }
        }
    }

    private addSkipOffset(queryBuilder: SelectQueryBuilder<TEntity>, page: Contracts.Search.ListPage): void {
        queryBuilder.skip(page.offset).take(page.limit);
    }
}
