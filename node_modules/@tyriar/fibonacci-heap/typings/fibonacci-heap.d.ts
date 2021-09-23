/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */

declare module '@tyriar/fibonacci-heap' {
  export type CompareFunction<K, V> = (a: INode<K, V>, b: INode<K, V>) => number;

  export interface INode<K, V> {
    key: K;
    value?: V;
  }

  /**
   * A Fibonacci heap data structure with a key and optional value.
   */
  export class FibonacciHeap<K, V> {
    /**
     * Creates a new Fibonacci heap.
     * @param compare A custom compare function.
     */
    constructor(compare?: CompareFunction<K, V>);

    /**
     * Clears the heap's data, making it an empty heap.
     */
    clear(): void;

    /**
     * Decreases a key of a node.
     * @param node The node to decrease the key of.
     * @param newKey The new key to assign to the node.
     */
    decreaseKey(node: INode<K, V>, newKey: K): void

    /**
     * Deletes a node.
     * @param node The node to delete.
     */
    delete(node: INode<K, V>): void;

    /**
     * Extracts and returns the minimum node from the heap.
     * @return The heap's minimum node or null if the heap is empty.
     */
    extractMinimum(): INode<K, V> | null;

    /**
     * Returns the minimum node from the heap.
     * @return The heap's minimum node or null if the heap is empty.
     */
    findMinimum(): INode<K, V> | null;

    /**
     * Inserts a new key-value pair into the heap.
     * @param key The key to insert.
     * @param value The value to insert.
     * @return node The inserted node.
     */
    insert(key: K, value?: V): INode<K, V>;

    /**
     * @return Whether the heap is empty.
     */
    isEmpty(): boolean;

    /**
     * @return The size of the heap.
     */
    size(): number;

    /**
     * Joins another heap to this heap.
     * @param other The other heap.
     */
    union(other: FibonacciHeap<K, V>): void;
  }
}
