import {
    everyOrCriteria,
    handleAndCriteria,
    handleNumericCriteria,
    handleOrCriteria,
    hasOrCriteria,
    optimizeExpression,
    someOrCriteria,
} from "../../../../packages/core-kernel/src/utils/search";

type UserEntity = {
    id: number;
    fullName: string;
    age: number;
    data: Record<string, any>;
};

describe("optimizeExpression", () => {
    it("should expand 'and' expression when it contains single expression", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "and",
            expressions: [{ property: "id", op: "equal", value: 5 }],
        });
        expect(expression).toEqual({ property: "id", op: "equal", value: 5 });
    });

    it("should expand 'or' expression when it contains single expression", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "or",
            expressions: [{ property: "id", op: "equal", value: 5 }],
        });
        expect(expression).toEqual({ property: "id", op: "equal", value: 5 });
    });

    it("should replace 'and' expression with 'true' expression when all expressions are 'true'", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "and",
            expressions: [{ op: "true" }, { op: "true" }],
        });
        expect(expression).toEqual({ op: "true" });
    });

    it("should replace 'and' expression with 'false' expression when any expression is 'false'", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "and",
            expressions: [{ op: "true" }, { op: "false" }],
        });
        expect(expression).toEqual({ op: "false" });
    });

    it("should replace 'or' expression with 'false' expression when all expressions are 'false'", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "or",
            expressions: [{ op: "false" }, { op: "false" }],
        });
        expect(expression).toEqual({ op: "false" });
    });

    it("should replace 'or' expression with 'true' expression when any expression is 'true'", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "or",
            expressions: [{ op: "true" }, { op: "false" }],
        });
        expect(expression).toEqual({ op: "true" });
    });

    it("should merge 'and' expressions", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "and",
            expressions: [
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
                {
                    op: "and",
                    expressions: [
                        { property: "id", op: "equal", value: 5 },
                        { property: "age", op: "greaterThanEqual", value: 35 },
                    ],
                },
            ],
        });

        expect(expression).toEqual({
            op: "and",
            expressions: [
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
                { property: "id", op: "equal", value: 5 },
                { property: "age", op: "greaterThanEqual", value: 35 },
            ],
        });
    });

    it("should merge 'or' expressions", () => {
        const expression = optimizeExpression<UserEntity>({
            op: "or",
            expressions: [
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
                {
                    op: "or",
                    expressions: [
                        { property: "id", op: "equal", value: 5 },
                        { property: "age", op: "greaterThanEqual", value: 35 },
                    ],
                },
            ],
        });

        expect(expression).toEqual({
            op: "or",
            expressions: [
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
                { property: "id", op: "equal", value: 5 },
                { property: "age", op: "greaterThanEqual", value: 35 },
            ],
        });
    });
});

describe("someOrCriteria", () => {
    it("should return true when some criteria matches predicate", () => {
        const criteria = [{ age: { from: 18, to: 25 } }, { age: { from: 36, to: 45 } }];
        const predicate = (c) => c.age.from >= 18;
        const match = someOrCriteria(criteria, predicate);
        expect(match).toBe(true);
    });

    it("should return true when criteria matches predicate", () => {
        const criteria = { age: { from: 18, to: 25 } };
        const predicate = (c) => c.age.from >= 18;
        const match = someOrCriteria(criteria, predicate);
        expect(match).toBe(true);
    });

    it("should return false when no criteria matches predicate", () => {
        const criteria = [{ age: { from: 18, to: 25 } }, { age: { from: 36, to: 45 } }];
        const predicate = (c) => c.age.from >= 46;
        const match = someOrCriteria(criteria, predicate);
        expect(match).toBe(false);
    });

    it("should return false when criteria doesn't match predicate", () => {
        const criteria = { age: { from: 36, to: 45 } };
        const predicate = (c) => c.age.from >= 46;
        const match = someOrCriteria(criteria, predicate);
        expect(match).toBe(false);
    });

    it("should return false when there are no criteria to match", () => {
        const criteria = [];
        const predicate = () => true;
        const match = someOrCriteria(criteria, predicate);
        expect(match).toBe(false);
    });

    it("should return false when criteria is undefined", () => {
        const criteria = undefined;
        const predicate = () => true;
        const match = someOrCriteria(criteria, predicate);
        expect(match).toBe(false);
    });
});

describe("everyOrCriteria", () => {
    it("should return true when every criteria matches predicate", () => {
        const criteria = [{ age: { from: 18, to: 25 } }, { age: { from: 36, to: 45 } }];
        const predicate = (c) => c.age.from >= 18;
        const match = everyOrCriteria(criteria, predicate);
        expect(match).toBe(true);
    });

    it("should return true when criteria matches predicate", () => {
        const criteria = { age: { from: 18, to: 25 } };
        const predicate = (c) => c.age.from >= 18;
        const match = everyOrCriteria(criteria, predicate);
        expect(match).toBe(true);
    });

    it("should return false when no criteria matches predicate", () => {
        const criteria = [{ age: { from: 18, to: 25 } }, { age: { from: 36, to: 45 } }];
        const predicate = (c) => c.age.from >= 46;
        const match = everyOrCriteria(criteria, predicate);
        expect(match).toBe(false);
    });

    it("should return false when criteria doesn't match predicate", () => {
        const criteria = { age: { from: 36, to: 45 } };
        const predicate = (c) => c.age.from >= 46;
        const match = everyOrCriteria(criteria, predicate);
        expect(match).toBe(false);
    });

    it("should return true when there are no criteria to match", () => {
        const criteria = [];
        const predicate = () => false;
        const match = everyOrCriteria(criteria, predicate);
        expect(match).toBe(true);
    });

    it("should return true when criteria is undefined", () => {
        const criteria = undefined;
        const predicate = () => true;
        const match = everyOrCriteria(criteria, predicate);
        expect(match).toBe(true);
    });
});

describe("hasOrCriteria", () => {
    it("should return true when there is criteria", () => {
        const criteria = [{ age: { from: 18, to: 25 } }, { age: { from: 36, to: 45 } }];
        const has = hasOrCriteria(criteria);
        expect(has).toBe(true);
    });

    it("should return false when there are no criteria", () => {
        const criteria = [];
        const has = hasOrCriteria(criteria);
        expect(has).toBe(false);
    });

    it("should return true when there is one criteria", () => {
        const criteria = { age: { from: 18, to: 25 } };
        const has = hasOrCriteria(criteria);
        expect(has).toBe(true);
    });
});

describe("handleAndCriteria", () => {
    it("should join properties using 'and' expression", async () => {
        const criteria = {
            age: { from: 18, to: 25 },
            fullName: "%Dmitry%",
        };

        const expression = await handleAndCriteria(criteria, async (k) => {
            switch (k) {
                case "age":
                    return { property: "age", op: "between", from: criteria.age.from, to: criteria.age.to };
                case "fullName":
                    return { property: "fullName", op: "like", pattern: criteria.fullName };
                default:
                    throw new Error("Unreachable");
            }
        });

        expect(expression).toEqual({
            op: "and",
            expressions: [
                { property: "age", op: "between", from: 18, to: 25 },
                { property: "fullName", op: "like", pattern: "%Dmitry%" },
            ],
        });
    });
});

describe("handleOrCriteria", () => {
    it("should join items using 'or' expression", async () => {
        const criteria = {
            age: [
                { from: 18, to: 25 },
                { from: 36, to: 45 },
            ],
        };

        const expression = await handleOrCriteria(criteria.age, async (c) => {
            return { property: "age", op: "between", from: c.from, to: c.to };
        });

        expect(expression).toEqual({
            op: "or",
            expressions: [
                { property: "age", op: "between", from: 18, to: 25 },
                { property: "age", op: "between", from: 36, to: 45 },
            ],
        });
    });

    it("should return 'or' expression containing single expression when there is single criteria", async () => {
        const criteria = { age: { from: 18, to: 25 } };
        const expression = await handleOrCriteria(criteria.age, async (c) => {
            return { property: "age", op: "between", from: c.from, to: c.to };
        });

        expect(expression).toEqual({
            op: "or",
            expressions: [{ property: "age", op: "between", from: 18, to: 25 }],
        });
    });
});

describe("handleNumericCriteria", () => {
    it("should return 'equal' expression when criteria is value", async () => {
        const criteria = { age: 45 };
        const expression = await handleNumericCriteria<UserEntity, "age">("age", criteria.age);
        expect(expression).toEqual({ property: "age", op: "equal", value: 45 });
    });

    it("should return 'between' expression when criteria is object with 'from' and 'to' properties", async () => {
        const criteria = { age: { from: 36, to: 45 } };
        const expression = await handleNumericCriteria<UserEntity, "age">("age", criteria.age);
        expect(expression).toEqual({ property: "age", op: "between", from: 36, to: 45 });
    });

    it("should return 'greaterThanEqual' expression when criteria is object with 'from' property", async () => {
        const criteria = { age: { from: 36 } };
        const expression = await handleNumericCriteria<UserEntity, "age">("age", criteria.age);
        expect(expression).toEqual({ property: "age", op: "greaterThanEqual", value: 36 });
    });

    it("should return 'lessThanEqual' expression when criteria is object with 'to' property", async () => {
        const criteria = { age: { to: 45 } };
        const expression = await handleNumericCriteria<UserEntity, "age">("age", criteria.age);
        expect(expression).toEqual({ property: "age", op: "lessThanEqual", value: 45 });
    });
});
