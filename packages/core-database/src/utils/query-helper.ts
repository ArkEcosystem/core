import { Contracts } from "@arkecosystem/core-kernel";
import { EntityMetadata } from "typeorm";

export type SqlExpression = {
    query: string;
    parameters: Record<string, any>;
};

export class QueryHelper<TEntity> {
    private paramNo = 1;

    public getColumnName(metadata: EntityMetadata, property: keyof TEntity): string {
        const column = metadata.columns.find((c) => c.propertyName === property);
        if (!column) {
            throw new Error(`Can't find ${String(property)} column`);
        }
        return column.databaseName;
    }

    public getWhereExpressionSql(
        metadata: EntityMetadata,
        expression: Contracts.Search.Expression<TEntity>,
    ): SqlExpression {
        switch (expression.op) {
            case "true": {
                return { query: "TRUE", parameters: {} };
            }
            case "false": {
                return { query: "FALSE", parameters: {} };
            }
            case "equal": {
                const column = this.getColumnName(metadata, expression.property);
                const param = `p${this.paramNo++}`;
                const query = `${column} = :${param}`;
                const parameters = { [param]: expression.value };
                return { query, parameters };
            }
            case "between": {
                const column = this.getColumnName(metadata, expression.property);
                const paramFrom = `p${this.paramNo++}`;
                const paramTo = `p${this.paramNo++}`;
                const query = `${column} BETWEEN :${paramFrom} AND :${paramTo}`;
                const parameters = { [paramFrom]: expression.from, [paramTo]: expression.to };
                return { query, parameters };
            }
            case "greaterThanEqual": {
                const column = this.getColumnName(metadata, expression.property);
                const param = `p${this.paramNo++}`;
                const query = `${column} >= :${param}`;
                const parameters = { [param]: expression.value };
                return { query, parameters };
            }
            case "lessThanEqual": {
                const column = this.getColumnName(metadata, expression.property);
                const param = `p${this.paramNo++}`;
                const query = `${column} <= :${param}`;
                const parameters = { [param]: expression.value };
                return { query, parameters };
            }
            case "like": {
                const column = this.getColumnName(metadata, expression.property);
                const param = `p${this.paramNo++}`;
                const query = `${column} LIKE :${param}`;
                const parameters = { [param]: expression.pattern };
                return { query, parameters };
            }
            case "contains": {
                const column = this.getColumnName(metadata, expression.property);
                const param = `p${this.paramNo++}`;
                const query = `${column} @> :${param}`;
                const parameters = { [param]: expression.value };
                return { query, parameters };
            }
            case "and": {
                const built = expression.expressions.map((e) => this.getWhereExpressionSql(metadata, e));
                const query = `(${built.map((b) => b.query).join(" AND ")})`;
                const parameters = built.reduce((acc, b) => Object.assign({}, acc, b.parameters), {});
                return { query, parameters };
            }
            case "or": {
                const built = expression.expressions.map((e) => this.getWhereExpressionSql(metadata, e));
                const query = `(${built.map((b) => b.query).join(" OR ")})`;
                const parameters = built.reduce((acc, b) => Object.assign({}, acc, b.parameters), {});
                return { query, parameters };
            }
            default:
                throw new Error(`Unexpected expression`);
        }
    }
}
