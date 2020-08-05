import { Utils } from "@arkecosystem/crypto";
import { get } from "@arkecosystem/utils";

import {
    AndExpression,
    BetweenExpression,
    EqualExpression,
    Expression,
    GreaterThanEqualExpression,
    LessThanEqualExpression,
    NumericCriteria,
    OrCriteria,
    Ordering,
    OrExpression,
    Page,
    Pagination,
    ParsedOrdering,
    StandardCriteriaOf,
    StandardCriteriaOfItem,
} from "../contracts/search";

export const optimizeExpression = <TEntity>(expression: Expression<TEntity>): Expression<TEntity> => {
    switch (expression.op) {
        case "and": {
            const optimized = expression.expressions.map(optimizeExpression);
            const flattened = optimized.reduce((acc, e) => {
                return e.op === "and" ? [...acc, ...e.expressions] : [...acc, e];
            }, [] as Expression<TEntity>[]);

            if (flattened.every((e) => e.op === "true")) {
                return { op: "true" };
            }
            if (flattened.some((e) => e.op === "false")) {
                return { op: "false" };
            }

            const expressions = flattened.filter((e) => e.op !== "true");
            return expressions.length === 1 ? expressions[0] : { op: "and", expressions };
        }

        case "or": {
            const optimized = expression.expressions.map(optimizeExpression);
            const flattened = optimized.reduce((acc, e) => {
                return e.op === "or" ? [...acc, ...e.expressions] : [...acc, e];
            }, [] as Expression<TEntity>[]);

            if (flattened.every((e) => e.op === "false")) {
                return { op: "false" };
            }
            if (flattened.some((e) => e.op === "true")) {
                return { op: "true" };
            }

            const expressions = flattened.filter((e) => e.op !== "false");
            return expressions.length === 1 ? expressions[0] : { op: "or", expressions };
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

// WALLET REPOSITORY SEARCH

export const isNumeric = (value: unknown): value is number | BigInt | Utils.BigNumber => {
    return typeof value === "number" || typeof value === "bigint" || value instanceof Utils.BigNumber;
};

/**
 * a === b
 */
export const isNumericEqual = (
    a: number | BigInt | Utils.BigNumber | string,
    b: number | BigInt | Utils.BigNumber | string,
): boolean => {
    if (a instanceof Utils.BigNumber) {
        return a.isEqualTo(b);
    }

    if (b instanceof Utils.BigNumber) {
        return b.isEqualTo(a);
    }

    if (typeof a === "string") {
        a = parseFloat(a);

        if (isNaN(a)) {
            return false;
        }
    }

    if (typeof b === "string") {
        b = parseFloat(b);

        if (isNaN(b)) {
            return false;
        }
    }

    return a == b; // == allows number to BigInt comparison
};

/**
 * a >= b
 */
export const isNumericGreaterThanEqual = (
    a: number | BigInt | Utils.BigNumber | string,
    b: number | BigInt | Utils.BigNumber | string,
): boolean => {
    if (a instanceof Utils.BigNumber) {
        return a.isGreaterThanEqual(b);
    }

    if (b instanceof Utils.BigNumber) {
        return b.isLessThanEqual(a);
    }

    if (typeof a === "string") {
        a = parseFloat(a);

        if (isNaN(a)) {
            return false;
        }
    }

    if (typeof b === "string") {
        b = parseFloat(b);

        if (isNaN(b)) {
            return false;
        }
    }

    return a >= b;
};

/**
 * a <= b
 */
export const isNumericLessThanEqual = (
    a: number | BigInt | Utils.BigNumber | string,
    b: number | BigInt | Utils.BigNumber | string,
): boolean => {
    if (a instanceof Utils.BigNumber) {
        return a.isLessThanEqual(b);
    }

    if (b instanceof Utils.BigNumber) {
        return b.isGreaterThanEqual(a);
    }

    if (typeof a === "string") {
        a = parseFloat(a);

        if (isNaN(a)) {
            return false;
        }
    }

    if (typeof b === "string") {
        b = parseFloat(b);

        if (isNaN(b)) {
            return false;
        }
    }

    return a <= b;
};

/**
 * value LIKE pattern (e.g. value LIKE '%keyword%')
 */
export const isStringLike = (value: string, pattern: string): boolean => {
    if (pattern.indexOf("%") === -1) {
        return pattern === value;
    }

    // TODO: handle escape sequences (\%, \\, etc)

    let nextIndexFrom = 0;
    for (const part of pattern.split("%")) {
        const index = value.indexOf(part, nextIndexFrom);
        if (index === -1) {
            return false;
        }
        nextIndexFrom = index + part.length;
    }
    return true;
};

export const testStandardCriteriaItem = <T>(value: T, criteriaItem: StandardCriteriaOfItem<T>): boolean => {
    if (Array.isArray(value)) {
        // unfortunately arrays are not supported
        return false;
    }

    if (typeof value === "boolean") {
        if (value === true && (criteriaItem === true || criteriaItem === "true")) {
            return true;
        }

        if (value === false && (criteriaItem === false || criteriaItem === "false")) {
            return true;
        }

        return false;
    }

    if (isNumeric(value)) {
        if (isNumeric(criteriaItem) || typeof criteriaItem === "string") {
            return isNumericEqual(criteriaItem, value);
        }

        if (typeof criteriaItem === "object" && criteriaItem !== null) {
            const from = "from" in criteriaItem && isNumeric(criteriaItem["from"]) ? criteriaItem["from"] : null;
            const to = "to" in criteriaItem && isNumeric(criteriaItem["to"]) ? criteriaItem["to"] : null;

            if (from !== null && to !== null) {
                return isNumericGreaterThanEqual(value, from) && isNumericLessThanEqual(value, to);
            }

            if (from !== null) {
                return isNumericGreaterThanEqual(value, from);
            }

            if (to) {
                return isNumericLessThanEqual(value, to);
            }

            return false;
        }

        return false;
    }

    if (typeof value === "string") {
        if (typeof criteriaItem === "string") {
            return isStringLike(value, criteriaItem);
        }

        return false;
    }

    if (typeof value === "object" && value !== null) {
        if (typeof criteriaItem === "object" && criteriaItem !== null) {
            return Object.entries(criteriaItem).every(([key, criteriaValue]) => {
                if (key === "*") {
                    return Object.values(value).some((valueValue) => {
                        return testStandardCriterias(valueValue, criteriaValue);
                    });
                } else {
                    return testStandardCriterias(value[key], criteriaItem);
                }
            });
        }

        return false;
    }

    return false;
};

export const testStandardCriterias = <T>(value: T, ...criterias: StandardCriteriaOf<T>[]): boolean => {
    for (const criteria of criterias) {
        if (Array.isArray(criteria)) {
            if (!criteria.some((criteriaItem) => testStandardCriteriaItem(value, criteriaItem))) {
                return false;
            }
        } else {
            if (!testStandardCriteriaItem(value, criteria)) {
                return false;
            }
        }
    }

    return true;
};

export const compareValues = <T>(a: T, b: T): number => {
    if (a instanceof Utils.BigNumber) {
        if (isNumeric(b) || typeof b === "string") {
            return a.comparedTo(b);
        } else {
            return -1;
        }
    }

    if (b instanceof Utils.BigNumber) {
        if (isNumeric(a) || typeof a === "string") {
            return b.comparedTo(a);
        } else {
            return 1;
        }
    }

    if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
    }

    if ((typeof a === "number" || typeof a === "bigint") && (typeof b === "number" || typeof b === "bigint")) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }

    if ((typeof a === "undefined" || a === null) && (typeof b === "undefined" || b === null)) {
        return 0;
    }

    if (typeof a === "undefined" || a === null) {
        return 1;
    }

    if (typeof b === "undefined" || b === null) {
        return -1;
    }

    return 0;
};

export const parseOrdering = (ordering: Ordering): ParsedOrdering => {
    return [ordering].flat(Number.MAX_VALUE).map((item) => {
        const [dot, direction] = item.split(":");

        if (direction !== "asc" && direction !== "desc") {
            return { path: dot.split("."), direction };
        } else {
            return { path: dot.split("."), direction: "asc" };
        }
    });
};

export const compareValuesByOrdering = <T>(a: T, b: T, ordering: ParsedOrdering): number => {
    for (const { path, direction } of ordering) {
        if (direction === "asc") {
            return compareValues(get(a, path), get(b, path));
        } else {
            return compareValues(get(a, path), get(b, path)) * -1;
        }
    }

    return 0;
};

export const getPage = <T>(pagination: Pagination, ordering: Ordering, items: Iterable<T>): Page<T> => {
    const parsedOrdering = parseOrdering(ordering);
    const total = Array.from(items);
    const results = total
        .sort((a, b) => compareValuesByOrdering(a, b, parsedOrdering))
        .slice(pagination.offset, pagination.offset + pagination.limit);

    return {
        results,
        totalCount: total.length,
        meta: { totalCountIsEstimate: false },
    };
};

export const getEmptyPage = (): Page<any> => {
    return { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
};
