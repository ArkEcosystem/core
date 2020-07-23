import { Utils } from "@arkecosystem/crypto";
import { get } from "@arkecosystem/utils";

import { ListOrder, ListPage, ListResult } from "../contracts/search";
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

export const isNumeric = (
    value: unknown | number | BigInt | Utils.BigNumber,
): value is number | BigInt | Utils.BigNumber => {
    if (value instanceof Utils.BigNumber) return true;
    if (typeof value === "bigint") return true;
    if (typeof value === "number") return true;
    return false;
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

export const matchesCriteria = (value: unknown, criteria: unknown): boolean => {
    // most of examples below filter transactions even though this function is used to filter wallets

    if (typeof criteria === "undefined") {
        // ignoring undefined in criteria
        return true;
    }

    if (Array.isArray(criteria)) {
        // ! dangerously confusing logic
        // meaning of array in criteria definition depends on value it's compared to (array or not)
        // with pluralization of the key being the only hint of what kind of value it is (payments - plural; type - single)

        if (Array.isArray(value)) {
            // when both criteria and value are arrays then every criteria element should match some value element
            // for example only multi-payment transaction that had both recipients (not just either one) will match criteria:
            //
            // const criteria = {
            //   typeGroup: Enums.TransactionTypeGroup.Core,
            //   type: Enums.TransactionType.MultiPayment
            //   asset: {
            //     payments: [
            //       { recipientId: "AReY3W6nTv3utiG2em5nefKEsGQeqEVPN4" },
            //       { recipientId: "AQEtL8akVZE5gMwxmHJpfFmnikpck2Fjm3" }
            //     ]
            //   }
            // }

            return criteria.every((itemCriteria) => {
                return value.some((valueItem) => {
                    return matchesCriteria(valueItem, itemCriteria);
                });
            });
        } else {
            // when criteria is array, but value isn't then some criteria element should match value
            // for example either delegate registration or delegate resignation transaction will match criteria:
            //
            // const criteria = {
            //   typeGroup: Enums.TransactionTypeGroup.Core,
            //   type: [
            //     Enums.TransactionType.DelegateRegistration,
            //     Enums.TransactionType.DelegateResignation
            //   ]
            // }

            return criteria.some((criteriaItem) => {
                return matchesCriteria(value, criteriaItem);
            });
        }
    }

    if (isNumeric(value)) {
        if (isNumeric(criteria) || typeof criteria === "string") {
            // when value is numeric and criteria is numeric or string then check if they are equal
            // for example it's possible to compare Utils.BigNumber to string:
            //
            // const criteria = {
            //   typeGroup: Enums.TransactionTypeGroup.Core,
            //   type: Enums.TransactionType.Transfer,
            //   amount: "1000000000000000"
            // }

            return isNumericEqual(criteria, value);
        }

        if (typeof criteria === "object" && criteria !== null) {
            // when value is numeric, but criteria is object check that it has 'from' or 'to' properties or both
            // for example to match transactions with amount greater than 1000000:
            //
            // const criteria = {
            //   typeGroup: Enums.TransactionTypeGroup.Core,
            //   type: Enums.TransactionType.Transfer,
            //   amount: { from: 1000000 }
            // }

            const from = "from" in criteria && isNumeric(criteria["from"]) ? criteria["from"] : null;
            const to = "to" in criteria && isNumeric(criteria["to"]) ? criteria["to"] : null;

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

    if (typeof value === "object" && value !== null) {
        if (typeof criteria === "object" && criteria !== null) {
            // when both criteria and value are objects then each criteria property should match value property
            // if criteria should match any value property, then there is a special '*' wildcard key:
            //
            // const criteria = {
            //   attributes: {
            //     locks: {
            //       "*": {
            //         recipientId: "AReY3W6nTv3utiG2em5nefKEsGQeqEVPN4"
            //       }
            //     }
            //   }
            // }

            return Object.entries(criteria).every(([key, criteriaItem]) => {
                if (key === "*") {
                    return Object.values(value).some((valueItem) => {
                        return matchesCriteria(valueItem, criteriaItem);
                    });
                } else {
                    const valueItem = value[key];
                    return matchesCriteria(valueItem, criteriaItem);
                }
            });
        }

        return false;
    }

    if (typeof value === "string") {
        if (typeof criteria === "string") {
            // when value and criteria are strings then compare using SQL-style LIKE pattern
            // for example if there was set of 'dead' addresses:
            //
            // const criteria = {
            //   recipientId: "%DEAD"
            // }

            return isStringLike(value, criteria);
        }

        return false;
    }

    if (typeof value === "boolean") {
        if (value === criteria) {
            return true;
        }

        if (value === true && criteria === "true") {
            return true;
        }

        if (value === false && criteria === "false") {
            return false;
        }
    }

    return false;
};

export const compareValues = (a: unknown, b: unknown): number => {
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

export const compareByOrder = (a: unknown, b: unknown, order: ListOrder): number => {
    for (const { property, direction } of order) {
        const result = compareValues(get(a, property), get(b, property));
        return direction === "asc" ? result : result * -1;
    }
    return 0;
};

export const getResultPage = <T>(allRows: T[], page: ListPage): ListResult<T> => {
    return {
        count: allRows.length,
        countIsEstimate: false,
        rows: allRows.slice(page.offset, page.offset + page.limit),
    };
};
