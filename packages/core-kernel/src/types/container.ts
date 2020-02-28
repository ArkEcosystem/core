/**
 * A class constructor.
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Function that returns T.
 */
export type FunctionReturning<T> = (...args: Array<any>) => T;

/**
 * A class or function returning T.
 */
export type ClassOrFunctionReturning<T> = FunctionReturning<T> | Constructor<T>;
