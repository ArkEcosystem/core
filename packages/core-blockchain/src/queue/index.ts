import { ProcessQueue } from "./process";
import { RebuildQueue } from "./rebuild";

export { ProcessQueue };
export { RebuildQueue };

export class Queue {
    public process: ProcessQueue;
    public rebuild: RebuildQueue;

    /**
     * Create an instance of the queue.
     * @param  {Blockchain} blockchain
     * @param  {Object} events
     * @return {void}
     */
    constructor(blockchain, events) {
        this.process = new ProcessQueue(blockchain, events.process);
        this.rebuild = new RebuildQueue(blockchain, events.rebuild);
    }

    /**
     * Pause all queues.
     * @return {void}
     */
    public pause() {
        this.rebuild.pause();
        this.process.pause();
    }

    /**
     * Flush all queues.
     * @return {void}
     */
    public clear() {
        this.rebuild.clear();
        this.process.clear();
    }

    /**
     *  Resue all queues.
     * @return {void}
     */
    public resume() {
        this.rebuild.resume();
        this.process.resume();
    }

    public destroy() {
        this.rebuild.destroy();
        this.process.destroy();
    }
}
