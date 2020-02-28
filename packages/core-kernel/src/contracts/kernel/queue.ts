/**
 * @interface QueueJob
 */
export interface QueueJob {
    handle(): void;
}

/**
 * @export
 * @interface Queue
 */
export interface Queue {
    /**
     * Create a new instance of the queue.
     *
     * @returns {Queue}
     * @memberof Queue
     */
    make(): Promise<Queue>;

    /**
     * Start the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    start(): Promise<void>;

    /**
     * Stop the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    stop(): Promise<void>;

    /**
     * Pause the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    pause(): Promise<void>;

    /**
     * Resume the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    resume(): Promise<void>;

    /**
     * Clear the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof Queue
     */
    clear(): Promise<void>;

    /**
     * Push a new job onto the default queue.
     *
     * @param {Function|QueueJob} job
     * @returns {Promise<void>}
     * @memberof Queue
     */
    push(job: Function | QueueJob): Promise<void>;

    /**
     * Push a new job onto the default queue after a delay.
     *
     * @param {number} delay
     * @param {Function|QueueJob} job
     * @returns {Promise<void>}
     * @memberof Queue
     */
    later(delay: number, job: Function | QueueJob): Promise<void>;

    /**
     * Push an array of jobs onto the default queue.
     *
     * @param {(Function|QueueJob)[]} jobs
     * @returns {Promise<void>}
     * @memberof Queue
     */
    bulk(jobs: Function[] | QueueJob[]): Promise<void>;

    /**
     * Get the size of the given queue.
     *
     * @param {string} [queue]
     * @returns {number}
     * @memberof Queue
     */
    size(): number;
}
