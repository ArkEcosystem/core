import { Queue } from "../../../contracts/kernel/queue";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryQueue
 * @implements {Queue}
 */
@injectable()
export class NullQueue implements Queue {
    /**
     * Start the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async start(queue?: string): Promise<void> {
        //
    }

    /**
     * Stop the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async stop(queue?: string): Promise<void> {
        //
    }

    /**
     * Pause the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async pause(queue?: string): Promise<void> {
        //
    }

    /**
     * Clear the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async clear(queue?: string): Promise<void> {
        //
    }

    /**
     * Push a new job onto the default queue.
     *
     * @template T
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async push<T = any>(fn: () => PromiseLike<T>): Promise<void> {
        //
    }

    /**
     * Push a new job onto the given queue.
     *
     * @template T
     * @param {string} queue
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async pushOn<T>(queue: string, fn: () => PromiseLike<T>): Promise<void> {
        //
    }

    /**
     * Push a new job onto the default queue after a delay.
     *
     * @template T
     * @param {number} delay
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async later<T>(delay: number, fn: () => PromiseLike<T>): Promise<void> {
        //
    }

    /**
     * Push a new job onto the given queue after a delay.
     *
     * @template T
     * @param {string} queue
     * @param {number} delay
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async laterOn<T>(queue: string, delay: number, fn: () => PromiseLike<T>): Promise<void> {
        //
    }

    /**
     * Push an array of jobs onto the default queue.
     *
     * @template T
     * @param {(() => PromiseLike<T>)[]} functions
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async bulk<T>(functions: (() => PromiseLike<T>)[]): Promise<void> {
        //
    }

    /**
     * Push an array of jobs onto the given queue.
     *
     * @template T
     * @param {string} queue
     * @param {(() => PromiseLike<T>)[]} functions
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async bulkOn<T>(queue: string, functions: (() => PromiseLike<T>)[]): Promise<void> {
        //
    }

    /**
     * Get the size of the given queue.
     *
     * @param {string} queue
     * @returns {number}
     * @memberof MemoryQueue
     */
    public size(queue?: string): number {
        return 0;
    }

    /**
     * Get the connection name for the queue.
     *
     * @returns {string}
     * @memberof MemoryQueue
     */
    public getDefaultQueue(): string {
        return "";
    }

    /**
     * Set the connection name for the queue.
     *
     * @param {string} name
     * @memberof MemoryQueue
     */
    public setDefaultQueue(name: string): void {
        //
    }
}
