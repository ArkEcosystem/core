import { Utils } from "@arkecosystem/crypto";
import { get } from "@arkecosystem/utils";

import { Ordering, Page, Pagination, ParsedOrdering } from "../contracts/search";
import { NumericCriteria, StandardCriteriaOf, StandardCriteriaOfItem } from "../contracts/search/criteria";
import { Expression } from "../contracts/search/expressions";

export const getOptimizedExpression = <TEntity>(expression: Expression<TEntity>): Expression<TEntity> => {
    switch (expression.op) {
        case "and": {
            const optimized = expression.expressions.map(getOptimizedExpression);
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
            const optimized = expression.expressions.map(getOptimizedExpression);
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

export const getCriteriasExpression = <TEntity, TCriteria>(
    criterias: TCriteria[],
    cb: (criteria: TCriteria) => Expression<TEntity>,
): Expression<TEntity> => {
    return getOptimizedExpression({ op: "and", expressions: criterias.map(cb) });
};

export const getCriteriaExpression = <TEntity, TCriteriaItem>(
    criteria: TCriteriaItem | TCriteriaItem[],
    cb: (criteriaItem: TCriteriaItem) => Expression<TEntity>,
): Expression<TEntity> => {
    if (Array.isArray(criteria)) {
        return getOptimizedExpression({ op: "or", expressions: criteria.map(cb) });
    } else {
        return getOptimizedExpression(cb(criteria));
    }
};

export const getObjectCriteriaItemExpression = <TEntity, TCriteriaItem extends object>(
    criteriaItem: TCriteriaItem | TCriteriaItem[],
    cb: (property: keyof TCriteriaItem) => Expression<TEntity>,
): Expression<TEntity> => {
    return { op: "and", expressions: Object.keys(criteriaItem).map((property) => cb(property as keyof TCriteriaItem)) };
};

export const getObjectCriteriaExpression = <TEntity, TCriteriaItem extends object>(
    criteria: TCriteriaItem | TCriteriaItem[],
    cb: (criteriaItem: TCriteriaItem, property: keyof TCriteriaItem) => Expression<TEntity>,
): Expression<TEntity> => {
    return getCriteriaExpression(criteria, (criteriaItem) => {
        return getObjectCriteriaItemExpression(criteriaItem, (property) => {
            return cb(criteriaItem, property);
        });
    });
};

export const getEqualExpression = <TEntity, T>(property: keyof TEntity, criteria: T | T[]): Expression<TEntity> => {
    return getCriteriaExpression(criteria, (criteriaItem) => {
        return { property, op: "equal", value: criteriaItem };
    });
};

export const getLikeExpression = <TEntity, T>(property: keyof TEntity, criteria: T | T[]): Expression<TEntity> => {
    return getCriteriaExpression(criteria, (criteriaItem) => {
        return { property, op: "like", pattern: criteriaItem };
    });
};

export const getContainsExpression = <TEntity, T>(property: keyof TEntity, criteria: T | T[]): Expression<TEntity> => {
    return getCriteriaExpression(criteria, (criteriaItem) => {
        return { property, op: "contains", value: criteriaItem };
    });
};

export const getNumericExpression = <TEntity, T>(
    property: keyof TEntity,
    criteria: NumericCriteria<T>,
): Expression<TEntity> => {
    return getCriteriaExpression(criteria, (criteriaItem) => {
        if (typeof criteriaItem === "object") {
            if ("from" in criteriaItem && "to" in criteriaItem) {
                return { op: "between", property, from: criteriaItem.from, to: criteriaItem.to };
            }
            if ("from" in criteriaItem) {
                return { op: "greaterThanEqual", property, value: criteriaItem.from };
            }
            if ("to" in criteriaItem) {
                return { op: "lessThanEqual", property, value: criteriaItem.to };
            }
        }

        return { op: "equal", property, value: criteriaItem };
    });
};

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

export const testCriteriaItem = <T>(value: T, criteriaItem: StandardCriteriaOfItem<T>): boolean => {
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
                        return testCriterias(valueValue, criteriaValue);
                    });
                } else {
                    return testCriterias(value[key], criteriaItem);
                }
            });
        }

        return false;
    }

    return false;
};

export const testCriterias = <T>(value: T, ...criterias: StandardCriteriaOf<T>[]): boolean => {
    for (const criteria of criterias) {
        if (Array.isArray(criteria)) {
            if (!criteria.some((criteriaItem) => testCriteriaItem(value, criteriaItem))) {
                return false;
            }
        } else {
            if (!testCriteriaItem(value, criteria)) {
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
    // sorting can be done on the fly through search binary tree
    // sorting needs to check for duplicate properties

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
