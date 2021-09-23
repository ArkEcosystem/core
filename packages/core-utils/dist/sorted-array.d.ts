declare type CompareFunction<T> = (a: T, b: T) => number;
declare type FindFunction<T> = (value: T, index?: number) => boolean;
export declare class SortedArray<T> {
    private sortedArray;
    private compareFunction;
    constructor(compareFunction: CompareFunction<T>);
    size(): number;
    isEmpty(): boolean;
    getCompareFunction(): CompareFunction<T>;
    insert(item: T): void;
    removeAtIndex(index: number): void;
    findIndex(findFunction: FindFunction<T>): number;
    getAll(): T[];
    getStrictlyBelow(max: T): T[];
    getStrictlyBetween(min: T, max: T): T[];
}
export {};
