import { Queue, QueueJob } from "../../../contracts/kernel/queue";
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
     * @type {(QueueJob[])}
     * @memberof MemoryQueue
     */
    private readonly jobs: QueueJob[] = [];

    /**
     * @private
     * @type {Promise<any[]>}
     * @memberof MemoryQueue
     */
    private lastQueue?: Promise<any[]>;

    /**
     * @private
     * @type {any[]}
     * @memberof MemoryQueue
     */
    private lastResults: any[] = [];

    /**
     * @private
     * @type {boolean}
     * @memberof MemoryQueue
     */
    private isRunning: boolean = false;

    /**
     * @private
     * @type {number}
     * @memberof MemoryQueue
     */
    private index: number = -1;

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
        this.lastQueue = this.lastQueue || this.processFromIndex(0);
    }

    /**
     * Stop the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async stop(): Promise<void> {
        await this.pause();

        this.clear();
    }

    /**
     * Pause the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async pause(): Promise<void> {
        this.isRunning = false;
    }

    /**
     * Resume the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async resume(): Promise<void> {
        this.lastQueue = this.processFromIndex(this.index, this.lastResults);
    }

    /**
     * Clear the queue.
     *
     * @returns {Promise<void>}
     * @memberof MemoryQueue
     */
    public async clear(): Promise<void> {
        this.index = -1;
        this.isRunning = false;
        this.lastQueue = undefined;
        this.jobs.splice(0);
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

    /**
     * @private
     * @param {number} from
     * @param {any[]} [lastResults=[]]
     * @param {boolean} [isRunning=true]
     * @returns {Promise<any[]>}
     * @memberof MemoryQueue
     */
    private async processFromIndex(from: number, lastResults: any[] = [], isRunning: boolean = true): Promise<any[]> {
        this.lastResults = lastResults;

        if (from < this.jobs.length) {
            this.index = from;

            if (isRunning) {
                this.isRunning = isRunning;

                try {
                    lastResults.push(await this.jobs[from].handle());

                    return this.processFromIndex(from + 1, lastResults, this.isRunning);
                } catch (error) {
                    this.isRunning = false;

                    throw new Error(
                        `Queue halted at job #${from + 1} due to error in handler ${this.jobs[this.index]}.`,
                    );
                }
            }
        } else {
            this.isRunning = false;
        }

        return this.lastResults;
    }
}
