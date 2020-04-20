import { Contracts } from "@arkecosystem/core-kernel";
import { EntityMetadata } from "typeorm";

export type SqlExpression = {
    query: string;
    parameters: Record<string, any>;
};

export class QueryHelper {
    private paramNo = 1;

    public getColumnName(metadata: EntityMetadata, property: string | number | symbol): string {
        const column = metadata.columns.find((c) => c.propertyName === property);
        if (!column) {
            throw new Error(`Can't find ${String(property)} column`);
        }
        return column.databaseName;
    }

    public getWhereExpressionSql(
        metadata: EntityMetadata,
        expression: Contracts.Shared.WhereExpression,
    ): SqlExpression {
        if (expression instanceof Contracts.Shared.TrueExpression) {
            return { query: "TRUE", parameters: {} };
        }

        if (expression instanceof Contracts.Shared.FalseExpression) {
            return { query: "FALSE", parameters: {} };
        }

        if (expression instanceof Contracts.Shared.EqualExpression) {
            const column = this.getColumnName(metadata, expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} = :${param}`;
            const parameters = { [param]: expression.value };
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.BetweenExpression) {
            const column = this.getColumnName(metadata, expression.property);
            const paramFrom = `p${this.paramNo++}`;
            const paramTo = `p${this.paramNo++}`;
            const query = `${column} BETWEEN :${paramFrom} AND :${paramTo}`;
            const parameters = { [paramFrom]: expression.from, [paramTo]: expression.to };
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.GreaterThanEqualExpression) {
            const column = this.getColumnName(metadata, expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} >= :${param}`;
            const parameters = { [param]: expression.from };
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.LessThanEqualExpression) {
            const column = this.getColumnName(metadata, expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} <= :${param}`;
            const parameters = { [param]: expression.to };
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.LikeExpression) {
            const column = this.getColumnName(metadata, expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} LIKE :${param}`;
            const parameters = { [param]: expression.value };
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.ContainsExpression) {
            const column = this.getColumnName(metadata, expression.property);
            const param = `p${this.paramNo++}`;
            const query = `${column} @> :${param}`;
            const parameters = { [param]: expression.value };
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.AndExpression) {
            const built = expression.expressions.map((e) => this.getWhereExpressionSql(metadata, e));
            const query = `(${built.map((b) => b.query).join(" AND ")})`;
            const parameters = built.reduce((acc, b) => Object.assign({}, acc, b.parameters), {});
            return { query, parameters };
        }

        if (expression instanceof Contracts.Shared.OrExpression) {
            const built = expression.expressions.map((e) => this.getWhereExpressionSql(metadata, e));
            const query = `(${built.map((b) => b.query).join(" OR ")})`;
            const parameters = built.reduce((acc, b) => Object.assign({}, acc, b.parameters), {});
            return { query, parameters };
        }

        throw new Error(`Unexpected expression ${expression.constructor.name}`);
    }
}
