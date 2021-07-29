import { EventEmitter } from "events";

import { Queue, QueueJob } from "../../../contracts/kernel/queue";
import { decorateInjectable, injectable } from "../../../ioc";

decorateInjectable(EventEmitter);

/**
 * @export
 * @class MemoryQueue
 * @implements {Queue}
 */
@injectable()
export class NullQueue extends EventEmitter implements Queue {
    /**
     * Create a new instance of the queue.
     *
     * @param {Application} app
     * @returns {Queue}
     * @memberof CacheStore
     */
    public async make(): Promise<Queue> {
        return this;
    }

    /**
     * Start the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async start(): Promise<void> {
        return;
    }

    /**
     * Stop the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async stop(): Promise<void> {
        return;
    }

    /**
     * Pause the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async pause(): Promise<void> {
        return;
    }

    /**
     * Resume the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async resume(): Promise<void> {
        return;
    }

    /**
     * Clear the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async clear(): Promise<void> {
        return;
    }

    /**
     * Push a new job onto the default queue.
     *
     * @param {QueueJob} job
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async push(job: QueueJob): Promise<void> {
        return;
    }

    /**
     * Push a new job onto the default queue after a delay.
     *
     * @param {number} delay
     * @param {QueueJob} job
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async later(delay: number, job: QueueJob): Promise<void> {
        return;
    }

    /**
     * Push an array of jobs onto the default queue.
     *
     * @param {(QueueJob)[]} jobs
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async bulk(jobs: QueueJob[]): Promise<void> {
        return;
    }

    /**
     * Get the size of the given queue.
     *
     * @param {string} queue
     * @returns {number}
     * @memberof MemoryQueue
     */
    public size(): number {
        return 0;
    }

    public isStarted(): boolean {
        return false;
    }

    public isRunning(): boolean {
        return false;
    }
}
