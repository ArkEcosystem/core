/**
 * @export
 * @interface Queue
 */
export interface Queue {
    /**
     * Start the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    start(queue?: string): Promise<void>;

    /**
     * Stop the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    stop(queue?: string): Promise<void>;

    /**
     * Pause the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    pause(queue?: string): Promise<void>;

    /**
     * Clear the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    clear(queue?: string): Promise<void>;

    /**
     * Push a new job onto the default queue.
     *
     * @template T
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof Queue
     */
    push<T = any>(fn: () => PromiseLike<T>): Promise<void>;

    /**
     * Push a new job onto the given queue.
     *
     * @template T
     * @param {string} queue
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof Queue
     */
    pushOn<T>(queue: string, fn: () => PromiseLike<T>): Promise<void>;

    /**
     * Push a new job onto the default queue after a delay.
     *
     * @template T
     * @param {number} delay
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof Queue
     */
    later<T>(delay: number, fn: () => PromiseLike<T>): Promise<void>;

    /**
     * Push a new job onto the given queue after a delay.
     *
     * @template T
     * @param {string} queue
     * @param {number} delay
     * @param {() => PromiseLike<T>} fn
     * @returns {Promise<void>}
     * @memberof Queue
     */
    laterOn<T>(queue: string, delay: number, fn: () => PromiseLike<T>): Promise<void>;

    /**
     * Push an array of jobs onto the default queue.
     *
     * @template T
     * @param {(() => PromiseLike<T>)[]} functions
     * @returns {Promise<void>}
     * @memberof Queue
     */
    bulk<T>(functions: (() => PromiseLike<T>)[]): Promise<void>;

    /**
     * Push an array of jobs onto the given queue.
     *
     * @template T
     * @param {string} queue
     * @param {(() => PromiseLike<T>)[]} functions
     * @returns {Promise<void>}
     * @memberof Queue
     */
    bulkOn<T>(queue: string, functions: (() => PromiseLike<T>)[]): Promise<void>;

    /**
     * Get the size of the given queue.
     *
     * @param {string} [queue]
     * @returns {number}
     * @memberof Queue
     */
    size(queue?: string): number;

    /**
     * Get the connection name for the queue.
     *
     * @returns {string}
     * @memberof Queue
     */
    getDefaultQueue(): string;

    /**
     * Set the connection name for the queue.
     *
     * @param {string} name
     * @memberof Queue
     */
    setDefaultQueue(name: string): void;
}
