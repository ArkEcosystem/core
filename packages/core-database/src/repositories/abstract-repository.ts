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
        sorting: Contracts.Search.Sorting = [],
    ): Promise<TEntity[]> {
        const queryBuilder: SelectQueryBuilder<TEntity> = this.createQueryBuilder().select();
        this.addWhere(queryBuilder, expression);
        this.addOrderBy(queryBuilder, sorting);
        return queryBuilder.getMany();
    }

    public async *streamByExpression(
        expression: Contracts.Search.Expression<TEntity>,
        sorting: Contracts.Search.Sorting = [],
    ): AsyncIterable<TEntity> {
        const queryBuilder = this.createQueryBuilder().select("*");
        this.addWhere(queryBuilder, expression);
        this.addOrderBy(queryBuilder, sorting);
        const stream = await queryBuilder.stream();

        for await (const raw of stream) {
            yield this.rawToEntity(raw);
        }
    }

    public async listByExpression(
        expression: Contracts.Search.Expression<TEntity>,
        sorting: Contracts.Search.Sorting,
        pagination: Contracts.Search.Pagination,
        options?: Contracts.Search.Options,
    ): Promise<Contracts.Search.ResultsPage<TEntity>> {
        const queryRunner = this.manager.connection.createQueryRunner("slave");

        try {
            await queryRunner.startTransaction("REPEATABLE READ");

            try {
                const resultsQueryBuilder = this.createQueryBuilder().setQueryRunner(queryRunner).select();
                this.addWhere(resultsQueryBuilder, expression);
                this.addOrderBy(resultsQueryBuilder, sorting);
                this.addSkipOffset(resultsQueryBuilder, pagination);

                const results = await resultsQueryBuilder.getMany();

                if (options?.estimateTotalCount === false) {
                    // typeorm@0.2.25 generates slow COUNT(DISTINCT primary_key_column) for getCount or getManyAndCount

                    const totalCountQueryBuilder = this.createQueryBuilder()
                        .setQueryRunner(queryRunner)
                        .select("COUNT(*) AS total_count");

                    this.addWhere(totalCountQueryBuilder, expression);

                    const totalCountRow = await totalCountQueryBuilder.getRawOne();
                    const totalCount = parseFloat(totalCountRow["total_count"]);

                    await queryRunner.commitTransaction();

                    return { results, totalCount, meta: { totalCountIsEstimate: false } };
                } else {
                    let totalCountEstimated = 0;
                    const [resultsSql, resultsParameters] = resultsQueryBuilder.getQueryAndParameters();
                    const resultsExplainedRows = await queryRunner.query(`EXPLAIN ${resultsSql}`, resultsParameters);
                    for (const resultsExplainedRow of resultsExplainedRows) {
                        const match = resultsExplainedRow["QUERY PLAN"].match(/rows=([0-9]+)/);
                        if (match) {
                            totalCountEstimated = parseFloat(match[1]);
                        }
                    }

                    const totalCount = Math.max(totalCountEstimated, results.length);

                    await queryRunner.commitTransaction();

                    return { results, totalCount, meta: { totalCountIsEstimate: true } };
                }
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
        } finally {
            await queryRunner.release();
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

    private addOrderBy(queryBuilder: SelectQueryBuilder<TEntity>, sorting: Contracts.Search.Sorting): void {
        if (sorting.length) {
            const column = this.queryHelper.getColumnName(this.metadata, sorting[0].property);
            queryBuilder.orderBy(column, sorting[0].direction === "desc" ? "DESC" : "ASC");

            for (const item of sorting.slice(1)) {
                const column = this.queryHelper.getColumnName(this.metadata, item.property);
                queryBuilder.addOrderBy(column, item.direction === "desc" ? "DESC" : "ASC");
            }
        }
    }

    private addSkipOffset(queryBuilder: SelectQueryBuilder<TEntity>, pagination: Contracts.Search.Pagination): void {
        queryBuilder.skip(pagination.offset).take(pagination.limit);
    }
}
