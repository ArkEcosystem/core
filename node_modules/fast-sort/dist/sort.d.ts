declare type IOrder = 1 | -1;
export interface IComparer {
    (a: any, b: any, order: IOrder): number;
}
export interface ISortInstanceOptions {
    comparer?: IComparer;
}
export interface ISortByFunction<T> {
    (prop: T): any;
}
export declare type ISortBy<T> = keyof T | ISortByFunction<T> | (keyof T | ISortByFunction<T>)[];
export interface ISortByAscSorter<T> extends ISortInstanceOptions {
    asc: boolean | ISortBy<T>;
}
export interface ISortByDescSorter<T> extends ISortInstanceOptions {
    desc: boolean | ISortBy<T>;
}
export declare type ISortByObjectSorter<T> = ISortByAscSorter<T> | ISortByDescSorter<T>;
declare function createSortInstance(opts: ISortInstanceOptions): <T>(ctx: T[]) => {
    /**
     * Sort array in ascending order. Mutates provided array by sorting it.
     * @example
     * sort([3, 1, 4]).asc();
     * sort(users).asc(u => u.firstName);
     * sort(users).asc([
     *   U => u.firstName
     *   u => u.lastName,
     * ]);
     */
    asc(sortBy?: ISortByFunction<T> | keyof T | (keyof T | ISortByFunction<T>)[] | ISortBy<T>[]): T[];
    /**
     * Sort array in descending order. Mutates provided array by sorting it.
     * @example
     * sort([3, 1, 4]).desc();
     * sort(users).desc(u => u.firstName);
     * sort(users).desc([
     *   U => u.firstName
     *   u => u.lastName,
     * ]);
     */
    desc(sortBy?: ISortByFunction<T> | keyof T | (keyof T | ISortByFunction<T>)[] | ISortBy<T>[]): T[];
    /**
     * Sort array in ascending or descending order. It allows sorting on multiple props
     * in different order for each of them. Mutates provided array by sorting it.
     * @example
     * sort(users).by([
     *  { asc: u => u.score }
     *  { desc: u => u.age }
     * ]);
     */
    by(sortBy: ISortByAscSorter<T> | ISortByDescSorter<T> | ISortByObjectSorter<T>[]): T[];
};
declare const defaultSort: <T>(ctx: T[]) => {
    /**
     * Sort array in ascending order. Mutates provided array by sorting it.
     * @example
     * sort([3, 1, 4]).asc();
     * sort(users).asc(u => u.firstName);
     * sort(users).asc([
     *   U => u.firstName
     *   u => u.lastName,
     * ]);
     */
    asc(sortBy?: ISortByFunction<T> | keyof T | (keyof T | ISortByFunction<T>)[] | ISortBy<T>[]): T[];
    /**
     * Sort array in descending order. Mutates provided array by sorting it.
     * @example
     * sort([3, 1, 4]).desc();
     * sort(users).desc(u => u.firstName);
     * sort(users).desc([
     *   U => u.firstName
     *   u => u.lastName,
     * ]);
     */
    desc(sortBy?: ISortByFunction<T> | keyof T | (keyof T | ISortByFunction<T>)[] | ISortBy<T>[]): T[];
    /**
     * Sort array in ascending or descending order. It allows sorting on multiple props
     * in different order for each of them. Mutates provided array by sorting it.
     * @example
     * sort(users).by([
     *  { asc: u => u.score }
     *  { desc: u => u.age }
     * ]);
     */
    by(sortBy: ISortByAscSorter<T> | ISortByDescSorter<T> | ISortByObjectSorter<T>[]): T[];
};
declare type ISortFunction = typeof defaultSort;
interface ISortExport extends ISortFunction {
    createNewInstance: typeof createSortInstance;
}
declare const _default: ISortExport;
export default _default;
