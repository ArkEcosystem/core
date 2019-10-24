import { assert } from "@packages/core-kernel/src/utils";
import PQueue from "p-queue";

import { Queue } from "../../../contracts/kernel/queue";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryQueue
 * @implements {Queue}
 */
@injectable()
export class MemoryQueue implements Queue {
    /**
     * @private
     * @type {Map<string, PQueue>}
     * @memberof MemoryQueue
     */
    private readonly queues: Map<string, PQueue> = new Map<string, PQueue>();

    /**
     * @private
     * @type {string}
     * @memberof MemoryQueue
     */
    private defaultQueue: string = "default";

    /**
     * Start the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async start(queue?: string): Promise<void> {
        await this.firstOrCreate(queue).start();
    }

    /**
     * Stop the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async stop(queue?: string): Promise<void> {
        await this.queues.delete(queue || this.defaultQueue);
    }

    /**
     * Pause the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async pause(queue?: string): Promise<void> {
        await this.firstOrCreate(queue).pause();
    }

    /**
     * Clear the queue.
     *
     * @param {string} [queue]
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async clear(queue?: string): Promise<void> {
        await this.firstOrCreate(queue).clear();
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
        this.firstOrCreate(this.defaultQueue).add(fn);
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
        this.firstOrCreate(queue).add(fn);
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
        setTimeout(() => this.push(fn), delay);
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
        setTimeout(() => this.pushOn(queue, fn), delay);
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
        this.firstOrCreate(this.defaultQueue).addAll(functions);
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
        this.firstOrCreate(queue).addAll(functions);
    }

    /**
     * Get the size of the given queue.
     *
     * @param {string} queue
     * @returns {number}
     * @memberof MemoryQueue
     */
    public size(queue?: string): number {
        return this.firstOrCreate(queue).size;
    }

    /**
     * Get the connection name for the queue.
     *
     * @returns {string}
     * @memberof MemoryQueue
     */
    public getDefaultQueue(): string {
        return this.defaultQueue;
    }

    /**
     * Set the connection name for the queue.
     *
     * @param {string} name
     * @memberof MemoryQueue
     */
    public setDefaultQueue(name: string): void {
        this.defaultQueue = name;
    }

    /**
     * @private
     * @param {string} name
     * @returns {PQueue}
     * @memberof MemoryQueue
     */
    private firstOrCreate(name?: string): PQueue {
        name = name || this.defaultQueue;

        if (!this.queues.has(name)) {
            this.queues.set(name, new PQueue({ autoStart: false }));
        }

        return assert.defined(this.queues.get(name));
    }
}
