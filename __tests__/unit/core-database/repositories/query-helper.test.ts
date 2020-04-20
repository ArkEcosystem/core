import { Contracts } from "@arkecosystem/core-kernel";

import { QueryHelper } from "../../../../packages/core-database/src/repositories/query-helper";

type UserEntity = {
    id: number;
    fullName: string;
    age: number;
    data: Record<string, any>;
};

const userMetadata = {
    columns: [
        { propertyName: "id", databaseName: "id" },
        { propertyName: "fullName", databaseName: "full_name" },
        { propertyName: "age", databaseName: "age" },
        { propertyName: "data", databaseName: "data" },
    ],
};

describe("QueryHelper.getColumnName", () => {
    it("should throw when column name can't be found", () => {
        const queryHelper = new QueryHelper();
        const check = () => queryHelper.getColumnName(userMetadata as any, "unknown");

        expect(check).toThrow();
    });

    it("should return column name", () => {
        const queryHelper = new QueryHelper();
        const columnName = queryHelper.getColumnName(userMetadata as any, "fullName");

        expect(columnName).toEqual("full_name");
    });
});

describe("QueryHelper.getWhereExpressionSql", () => {
    it("should throw when VoidExpression is passed", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.VoidExpression();
        const check = () => queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(check).toThrow();
    });

    it("should convert TrueExpression to 'TRUE'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.TrueExpression();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("TRUE");
        expect(sqlExpression.parameters).toEqual({});
    });

    it("should convert FalseExpression to 'FALSE'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.FalseExpression();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("FALSE");
        expect(sqlExpression.parameters).toEqual({});
    });

    it("should convert EqualExpression to 'column = :p1'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.EqualExpression<UserEntity>("id", 5);
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("id = :p1");
        expect(sqlExpression.parameters).toEqual({ p1: 5 });
    });

    it("should convert BetweenExpression to 'column BETWEEN :p1 AND :p2'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.BetweenExpression<UserEntity>("age", 26, 35);
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("age BETWEEN :p1 AND :p2");
        expect(sqlExpression.parameters).toEqual({ p1: 26, p2: 35 });
    });

    it("should convert GreaterThanEqualExpression to 'column >= :p1'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.GreaterThanEqualExpression<UserEntity>("age", 26);
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("age >= :p1");
        expect(sqlExpression.parameters).toEqual({ p1: 26 });
    });

    it("should convert LessThanEqualExpression to 'column <= :p1'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.LessThanEqualExpression<UserEntity>("age", 35);
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("age <= :p1");
        expect(sqlExpression.parameters).toEqual({ p1: 35 });
    });

    it("should convert LikeExpression to 'column LIKE :p1'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.LikeExpression<UserEntity>("fullName", "%Dmitry%");
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("full_name LIKE :p1");
        expect(sqlExpression.parameters).toEqual({ p1: "%Dmitry%" });
    });

    it("should convert ContainsExpression to 'column @> :p1'", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = new Contracts.Shared.ContainsExpression<UserEntity>("data", {
            creditCard: { number: "5555 5555 5555 5555" },
        });
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("data @> :p1");
        expect(sqlExpression.parameters).toEqual({
            p1: {
                creditCard: { number: "5555 5555 5555 5555" },
            },
        });
    });

    it("should convert AndExpression to (expression1 AND expression2)", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = Contracts.Shared.AndExpression.make([
            new Contracts.Shared.LikeExpression<UserEntity>("fullName", "%Dmitry%"),
            new Contracts.Shared.GreaterThanEqualExpression<UserEntity>("age", 35),
        ]);
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("(full_name LIKE :p1 AND age >= :p2)");
        expect(sqlExpression.parameters).toEqual({ p1: "%Dmitry%", p2: 35 });
    });

    it("should convert OrExpression to (expression1 OR expression2)", () => {
        const queryHelper = new QueryHelper();
        const whereExpression = Contracts.Shared.OrExpression.make([
            new Contracts.Shared.LikeExpression<UserEntity>("fullName", "%Dmitry%"),
            new Contracts.Shared.GreaterThanEqualExpression<UserEntity>("age", 35),
        ]);
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, whereExpression);

        expect(sqlExpression.query).toEqual("(full_name LIKE :p1 OR age >= :p2)");
        expect(sqlExpression.parameters).toEqual({ p1: "%Dmitry%", p2: 35 });
    });
});
