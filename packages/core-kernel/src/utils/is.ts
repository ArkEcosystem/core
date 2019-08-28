/**
 * @param {unknown} obj
 * @returns {value is undefined}
 */
export const isUndefined = (value: unknown): value is undefined => typeof value === "undefined";

/**
 * @param {unknown} obj
 * @returns {(value is null | undefined)}
 */
export const isNil = (value: unknown): value is null | undefined => isUndefined(value) || value === null;

/**
 * @param {*} value
 * @returns {boolean}
 */
export const isEmpty = (value: any): boolean => !(value && value.length > 0);

/**
 * @param {unknown} value
 * @returns {value is object}
 */
export const isObject = (value: unknown): value is object => !isNil(value) && typeof value === "object";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isFunction = (value: unknown): boolean => typeof value === "function";

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export const isString = (value: unknown): value is string => typeof value === "string";

/**
 * @param {*} value
 * @returns {boolean}
 */
export const isConstructor = (value: any): boolean => !!value.prototype && !!value.prototype.constructor.name;

/**
 * @param {unknown} value
 * @returns {value is symbol}
 */
export const isSymbol = (value: unknown): value is symbol => typeof value === "symbol";

/**
 * @template T
 * @param {unknown} value
 * @param {string} type
 * @returns {value is T[]}
 */
export const isArrayOfType = <T>(value: unknown, type: string): value is T[] =>
    Array.isArray(value) && value.every(element => typeof element === type);

/**
 * @param {unknown} value
 * @returns {value is number[]}
 */
export const isNumberArray = (value: unknown): value is number[] => isArrayOfType<number>(value, "number");

/**
 * @param {unknown} value
 * @returns {value is string[]}
 */
export const isStringArray = (value: unknown): value is string[] => isArrayOfType<string>(value, "string");

/**
 * @param {unknown} value
 * @returns {value is boolean[]}
 */
export const isBooleanArray = (value: unknown): value is boolean[] => isArrayOfType<boolean>(value, "boolean");
