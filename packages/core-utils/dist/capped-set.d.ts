export declare class CappedSet<T> {
    private readonly data;
    private maxSize;
    constructor(maxSize?: number);
    add(newElement: T): void;
    has(element: T): boolean;
}
