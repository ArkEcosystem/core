declare type CompareFunction<T> = (a: T, b: T) => number;
declare class Node<T> {
    values: {
        [id: string]: T;
    };
    lastValueAdded: T;
    left: Node<T> | undefined;
    right: Node<T> | undefined;
    parent: Node<T> | undefined;
    constructor(parent?: Node<T>);
    getStruct(): any;
}
export declare class Tree<T> {
    private root;
    private compareFunction;
    constructor(compareFunction: CompareFunction<T>);
    getAll(): T[];
    getValuesLastToFirst(limit: number): T[];
    getLast(): T[];
    getAllStrictlyBelow(max: T): T[];
    getAllStrictlyBetween(min: T, max: T): T[];
    insert(id: string, value: T): void;
    find(id: string, value: T): T | undefined;
    remove(id: string, value: T): void;
    isEmpty(): boolean;
    getCompareFunction(): CompareFunction<T>;
    toJSON(node?: Node<T>): string;
    private findMin;
    private findNode;
    private removeNode;
    private removeChild;
    private replaceChild;
    private getAllStrictlyBelowFromChildNodes;
    private getAllStrictlyBetweenFromChildNodes;
    private getFromChildNodes;
    private getFromChildNodesReverseOrder;
    private getOrCreateLeftNode;
    private getOrCreateRightNode;
}
export {};
