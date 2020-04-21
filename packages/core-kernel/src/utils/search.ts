import { NumericCriteria, OrCriteria } from "../contracts/search/criteria";
import {
    AndExpression,
    BetweenExpression,
    EqualExpression,
    Expression,
    GreaterThanEqualExpression,
    LessThanEqualExpression,
    OrExpression,
} from "../contracts/search/expressions";

export const optimizeExpression = <TEntity>(expression: Expression<TEntity>): Expression<TEntity> => {
    switch (expression.op) {
        case "and":
        case "or": {
            const optimized = expression.expressions.map(optimizeExpression);
            const collapsed = optimized.reduce((acc, e) => {
                if (e.op === "void") {
                    return acc;
                }
                if (e.op === expression.op) {
                    return [...acc, ...e.expressions];
                }

                return [...acc, e];
            }, [] as Expression<TEntity>[]);

            if (collapsed.length === 0) {
                return { op: "void" };
            }
            if (collapsed.length === 1) {
                return collapsed[0];
            }

            return { op: expression.op, expressions: collapsed };
        }
        default:
            return expression;
    }
};

export const someOrCriteria = <TCriteria>(
    criteria: OrCriteria<TCriteria>,
    predicate: (c: TCriteria) => boolean,
): boolean => {
    if (typeof criteria === "undefined") {
        return false;
    }
    if (Array.isArray(criteria)) {
        return criteria.some(predicate);
    }
    return predicate(criteria);
};

export const everyOrCriteria = <TCriteria>(
    criteria: OrCriteria<TCriteria>,
    predicate: (c: TCriteria) => boolean,
): boolean => {
    if (typeof criteria === "undefined") {
        return true;
    }
    if (Array.isArray(criteria)) {
        return criteria.every(predicate);
    }
    return predicate(criteria);
};

export const hasOrCriteria = <TCriteria>(criteria: OrCriteria<TCriteria>): boolean => {
    return someOrCriteria(criteria, () => true);
};

export const handleAndCriteria = async <TEntity, TCriteria>(
    criteria: TCriteria,
    cb: <K extends keyof TCriteria>(key: K) => Promise<Expression<TEntity>>,
): Promise<AndExpression<TEntity>> => {
    const promises = Object.keys(criteria)
        .filter((key) => typeof criteria[key] !== "undefined")
        .map((key) => cb(key as keyof TCriteria));
    const expressions = await Promise.all(promises);
    return { op: "and", expressions };
};

export const handleOrCriteria = async <TEntity, TCriteria>(
    criteria: OrCriteria<TCriteria>,
    cb: (criteria: TCriteria) => Promise<Expression<TEntity>>,
): Promise<OrExpression<TEntity>> => {
    if (Array.isArray(criteria)) {
        const promises = criteria.map((c) => cb(c));
        const expressions = await Promise.all(promises);
        return { op: "or", expressions };
    } else {
        const expression = await cb(criteria);
        return { op: "or", expressions: [expression] };
    }
};

export const handleNumericCriteria = async <TEntity, TProperty extends keyof TEntity>(
    property: TProperty,
    criteria: NumericCriteria<NonNullable<TEntity[TProperty]>>,
): Promise<
    | EqualExpression<TEntity>
    | BetweenExpression<TEntity>
    | GreaterThanEqualExpression<TEntity>
    | LessThanEqualExpression<TEntity>
> => {
    if (typeof criteria === "object") {
        if ("from" in criteria && "to" in criteria) {
            return { op: "between", property, from: criteria.from, to: criteria.to };
        }
        if ("from" in criteria) {
            return { op: "greaterThanEqual", property, value: criteria.from };
        }
        if ("to" in criteria) {
            return { op: "lessThanEqual", property, value: criteria.to };
        }
    }

    return { op: "equal", property, value: criteria };
};
