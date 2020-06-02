import { QueryHelper } from "../../../../packages/core-database/src/utils/query-helper";

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
        const queryHelper = new QueryHelper<UserEntity>();
        const check = () => queryHelper.getColumnName(userMetadata as any, "unknown" as any);

        expect(check).toThrow();
    });

    it("should return column name", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const columnName = queryHelper.getColumnName(userMetadata as any, "fullName");

        expect(columnName).toEqual("full_name");
    });
});

describe("QueryHelper.getWhereExpressionSql", () => {
    it("should throw when unexpected expression is passed", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const check = () => queryHelper.getWhereExpressionSql(userMetadata as any, { op: "nonsense" } as any);

        expect(check).toThrow();
    });

    it("should convert TrueExpression to 'TRUE'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, { op: "true" });

        expect(sqlExpression.query).toEqual("TRUE");
        expect(sqlExpression.parameters).toEqual({});
    });

    it("should convert FalseExpression to 'FALSE'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, { op: "false" });

        expect(sqlExpression.query).toEqual("FALSE");
        expect(sqlExpression.parameters).toEqual({});
    });

    it("should convert EqualExpression to 'column = :p1'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            property: "id",
            op: "equal",
            value: 5,
        });

        expect(sqlExpression.query).toEqual("id = :p1");
        expect(sqlExpression.parameters).toEqual({ p1: 5 });
    });

    it("should convert BetweenExpression to 'column BETWEEN :p1 AND :p2'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            property: "age",
            op: "between",
            from: 26,
            to: 35,
        });

        expect(sqlExpression.query).toEqual("age BETWEEN :p1 AND :p2");
        expect(sqlExpression.parameters).toEqual({ p1: 26, p2: 35 });
    });

    it("should convert GreaterThanEqualExpression to 'column >= :p1'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            property: "age",
            op: "greaterThanEqual",
            value: 26,
        });

        expect(sqlExpression.query).toEqual("age >= :p1");
        expect(sqlExpression.parameters).toEqual({ p1: 26 });
    });

    it("should convert LessThanEqualExpression to 'column <= :p1'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            property: "age",
            op: "lessThanEqual",
            value: 35,
        });

        expect(sqlExpression.query).toEqual("age <= :p1");
        expect(sqlExpression.parameters).toEqual({ p1: 35 });
    });

    it("should convert LikeExpression to 'column LIKE :p1'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            property: "fullName",
            op: "like",
            pattern: "%Dmitry%",
        });

        expect(sqlExpression.query).toEqual("full_name LIKE :p1");
        expect(sqlExpression.parameters).toEqual({ p1: "%Dmitry%" });
    });

    it("should convert ContainsExpression to 'column @> :p1'", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            property: "data",
            op: "contains",
            value: {
                creditCard: { number: "5555 5555 5555 5555" },
            },
        });

        expect(sqlExpression.query).toEqual("data @> :p1");
        expect(sqlExpression.parameters).toEqual({
            p1: {
                creditCard: { number: "5555 5555 5555 5555" },
            },
        });
    });

    it("should convert AndExpression to (expression1 AND expression2)", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            op: "and",
            expressions: [
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
                { property: "age", op: "greaterThanEqual", value: 35 },
            ],
        });

        expect(sqlExpression.query).toEqual("(full_name LIKE :p1 AND age >= :p2)");
        expect(sqlExpression.parameters).toEqual({ p1: "%Dmitry%", p2: 35 });
    });

    it("should convert OrExpression to (expression1 OR expression2)", () => {
        const queryHelper = new QueryHelper<UserEntity>();
        const sqlExpression = queryHelper.getWhereExpressionSql(userMetadata as any, {
            op: "or",
            expressions: [
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
                { property: "age", op: "greaterThanEqual", value: 35 },
            ],
        });

        expect(sqlExpression.query).toEqual("(full_name LIKE :p1 OR age >= :p2)");
        expect(sqlExpression.parameters).toEqual({ p1: "%Dmitry%", p2: 35 });
    });
});
