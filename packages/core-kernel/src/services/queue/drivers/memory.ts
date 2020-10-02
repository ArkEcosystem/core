import { performance } from "perf_hooks";

import { EventDispatcher } from "../../../contracts/kernel/events";
import {
    Queue,
    QueueJob,
    QueueOnDataFunction,
    QueueOnDrainFunction,
    QueueOnErrorFunction,
} from "../../../contracts/kernel/queue";
import { QueueEvent } from "../../../enums";
import { Identifiers, inject, injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryQueue
 * @implements {Queue}
 */
@injectable()
export class MemoryQueue implements Queue {
    @inject(Identifiers.EventDispatcherService)
    private readonly events!: EventDispatcher;

    /**
     * @private
     * @type {(QueueJob[])}
     * @memberof MemoryQueue
     */
    private jobs: QueueJob[] = [];

    /**
     * @private
     * @type {boolean}
     * @memberof MemoryQueue
     */
    private running: boolean = false;
    private started: boolean = false;

    private onDataCallback: QueueOnDataFunction | undefined = undefined;
    private onErrorCallback: QueueOnErrorFunction | undefined = undefined;
    private onDrainCallback: QueueOnDrainFunction | undefined = undefined;

    private onProcessedCallbacks: QueueOnDrainFunction[] = [];

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
        this.started = true;

        this.processJobs();
    }

    /**
     * Stop the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async stop(): Promise<void> {
        this.started = false;

        const promise = this.waitUntilProcessed();

        await this.clear();

        return promise;
    }

    /**
     * Pause the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async pause(): Promise<void> {
        this.started = false;

        await this.waitUntilProcessed();
    }

    /**
     * Resume the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async resume(): Promise<void> {
        await this.start();
    }

    /**
     * Clear the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async clear(): Promise<void> {
        this.jobs = [];
    }

    /**
     * Push a new job onto the queue.
     *
     * @template T
     * @param {QueueJob} job
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async push(job: QueueJob): Promise<void> {
        this.jobs.push(job);

        this.processJobs();
    }

    /**
     * Push a new job onto the queue after a delay.
     *
     * @template T
     * @param {number} delay
     * @param {QueueJob} job
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async later(delay: number, job: QueueJob): Promise<void> {
        setTimeout(() => this.push(job), delay);
    }

    /**
     * Push an array of jobs onto the queue.
     *
     * @param {QueueJob[]} jobs
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async bulk(jobs: QueueJob[]): Promise<void> {
        for (const job of jobs) {
            this.jobs.push(job);
        }
    }

    /**
     * Get the size of the queue.
     *
     * @returns {number}
     * @memberof MemoryQueue
     */
    public size(): number {
        return this.jobs.length;
    }

    public isStarted(): boolean {
        return this.started;
    }

    public isRunning(): boolean {
        return this.running;
    }

    public onData(callback: QueueOnDataFunction): void {
        this.onDataCallback = callback;
    }

    public onError(callback: QueueOnErrorFunction): void {
        this.onErrorCallback = callback;
    }

    public onDrain(callback: QueueOnDrainFunction): void {
        this.onDrainCallback = callback;
    }

    private waitUntilProcessed(): Promise<void> {
        return new Promise((resolve) => {
            if (this.running) {
                const onProcessed = () => {
                    resolve();
                };

                this.onProcessedCallbacks.push(onProcessed);
            } else {
                resolve();
            }
        });
    }

    private resolveOnProcessed(): void {
        while (this.onProcessedCallbacks.length) {
            const onProcessed = this.onProcessedCallbacks.shift()!;

            onProcessed();
        }
    }

    private async processJobs(): Promise<void> {
        // Prevent entering if already processing
        if (this.isRunning()) {
            return;
        }

        while (this.jobs.length) {
            if (!this.started) {
                break;
            }

            this.running = true;

            const job = this.jobs.shift()!;

            const start = performance.now();
            try {
                const data = await job.handle();

                await this.events.dispatch(QueueEvent.Finished, {
                    driver: "memory",
                    executionTime: performance.now() - start,
                    data: data,
                });

                if (this.onDataCallback) {
                    this.onDataCallback(job, data);
                }
            } catch (error) {
                await this.events.dispatch(QueueEvent.Failed, {
                    driver: "memory",
                    executionTime: performance.now() - start,
                    error: error,
                });

                if (this.onErrorCallback) {
                    this.onErrorCallback(job, error);
                }
            }
        }

        this.running = false;

        this.resolveOnProcessed();

        if (!this.jobs.length && this.onDrainCallback) {
            this.onDrainCallback();
        }
    }
}
