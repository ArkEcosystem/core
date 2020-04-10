import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";

export class SqlExpression {
    public readonly query: string;
    public readonly parameters: Record<string, any>;

    public constructor(query: string, parameters: Record<string, any> = {}) {
        this.query = query;
        this.parameters = parameters;
    }
}

export abstract class AbstractEntityRepository<TModel extends ObjectLiteral> extends Repository<TModel> {
    private paramNo = 0;

    public async findById(id: string): Promise<TModel> {
        return (await this.findByIds([id]))[0];
    }

    public async findOneByExpression(expression: Contracts.Database.Expression<TModel>): Promise<TModel | undefined> {
        const queryBuilder: SelectQueryBuilder<TModel> = this.createQueryBuilder().select();
        if (expression instanceof Contracts.Database.VoidExpression === false) {
            const sqlExpression: SqlExpression = this.buildSqlExpression(expression);
            queryBuilder.where(sqlExpression.query, sqlExpression.parameters);
        }
        return queryBuilder.getOne();
    }

    public async findManyByExpression(expression: Contracts.Database.Expression<TModel>): Promise<TModel[]> {
        const queryBuilder: SelectQueryBuilder<TModel> = this.createQueryBuilder().select();
        if (expression instanceof Contracts.Database.VoidExpression === false) {
            const sqlExpression: SqlExpression = this.buildSqlExpression(expression);
            queryBuilder.where(sqlExpression.query, sqlExpression.parameters);
        }

        return queryBuilder.getMany();
    }

    public async listByExpression(
        expression: Contracts.Database.Expression<TModel>,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<TModel>> {
        const queryBuilder = this.createQueryBuilder().select().skip(page.offset).take(page.limit);

        if (expression instanceof Contracts.Database.VoidExpression === false) {
            const sqlExpression = this.buildSqlExpression(expression);
            queryBuilder.where(sqlExpression.query, sqlExpression.parameters);
        }

        for (const item of order) {
            const column = this.getColumn(item.property);
            queryBuilder.addOrderBy(column, item.direction.toUpperCase() as "ASC" | "DESC");
        }

        const [rows, count]: [TModel[], number] = await queryBuilder.getManyAndCount();
        return { rows, count, countIsEstimate: false };
    }

    protected rawToEntity(
        rawEntity: Record<string, any>,
        customPropertyHandler?: (entity: { [P in keyof TModel]?: TModel[P] }, key: string, value: any) => void,
    ): TModel {
        const entity: TModel = this.create();
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
                    propertyValue = propertyValue.toString("utf8");
                } else {
                    propertyValue = value;
                }

                entity[(columnMetadata.propertyName as unknown) as keyof TModel] = propertyValue;
            } else {
                // Just attach custom properties, which are probably wanted if `rawToEntity` is called.
                // TODO: add an additional type parameter (i.e. `this.rawToEntity<{ someField }>(result)`) to return
                // TModel & { someField } from the function.
                if (customPropertyHandler) {
                    customPropertyHandler(entity, key, value);
                } else {
                    entity[(key as unknown) as keyof TModel] = value;
                }
            }
        }

        return entity;
    }

    private buildSqlExpression(expression: Contracts.Database.Expression<TModel>): SqlExpression {
        if (expression instanceof Contracts.Database.TrueExpression) {
            return new SqlExpression("TRUE", {});
        }

        if (expression instanceof Contracts.Database.FalseExpression) {
            return new SqlExpression("FALSE", {});
        }

        if (expression instanceof Contracts.Database.EqualExpression) {
            const column = this.getColumn(expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} = :${param}`;
            const parameters = { [param]: expression.value };
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.BetweenExpression) {
            const column = this.getColumn(expression.property);
            const paramFrom = `p${this.paramNo++}`;
            const paramTo = `p${this.paramNo++}`;
            const query = `${column} BETWEEN :${paramFrom} AND :${paramTo}`;
            const parameters = { [paramFrom]: expression.from, [paramTo]: expression.to };
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.GreaterThanEqualExpression) {
            const column = this.getColumn(expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} >= :${param}`;
            const parameters = { [param]: expression.from };
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.LessThanEqualExpression) {
            const column = this.getColumn(expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} <= :${param}`;
            const parameters = { [param]: expression.to };
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.LikeExpression) {
            const column = this.getColumn(expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} LIKE :${param}`;
            const parameters = { [param]: expression.value };
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.ContainsExpression) {
            const column = this.getColumn(expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} @> :${param}`;
            const parameters = { [param]: expression.value };
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.AndExpression) {
            const built: SqlExpression[] = expression.expressions.map(this.buildSqlExpression.bind(this));
            const query = `(${built.map((b) => b.query).join(" AND ")})`;
            const parameters = built.reduce((acc, b) => Object.assign({}, acc, b.parameters), {});
            return new SqlExpression(query, parameters);
        }

        if (expression instanceof Contracts.Database.OrExpression) {
            const built: SqlExpression[] = expression.expressions.map(this.buildSqlExpression.bind(this));
            const query = `(${built.map((b) => b.query).join(" OR ")})`;
            const parameters = built.reduce((acc, b) => Object.assign({}, acc, b.parameters), {});
            return new SqlExpression(query, parameters);
        }

        throw new Error(`Unexpected expression ${expression.constructor.name}`);
    }

    private getColumn<TProperty extends keyof TModel>(property: TProperty): string {
        const column = this.metadata.columns.find((c) => c.propertyName === property);
        if (!column) {
            throw new Error(`Can't find column for ${this.metadata.targetName}.${property}`);
        }
        return column.databaseName;
    }
}
