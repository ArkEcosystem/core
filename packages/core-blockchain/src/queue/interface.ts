import async from "async";
import { Blockchain } from "../blockchain";

export abstract class QueueInterface {
    protected queue: async;

    /**
     * Create an instance of the process queue.
     */
    constructor(readonly blockchain: Blockchain, readonly event: string) {}

    /**
     * Drain the queue.
     */
    public drain() {
        this.queue.drain = () => this.blockchain.dispatch(this.event);
    }

    /**
     * Pause the queue.
     * @return {void}
     */
    public pause() {
        return this.queue.pause();
    }

    /**
     * Flush the queue.
     * @return {void}
     */
    public clear() {
        return this.queue.remove(() => true);
    }

    /**
     * Resume the queue.
     * @return {void}
     */
    public resume() {
        return this.queue.resume();
    }

    /**
     * Remove the item from the queue.
     * @return {void}
     */
    public remove(item) {
        return this.queue.remove(item);
    }

    /**
     * Push the item to the queue.
     * @param {Function} callback
     * @return {void}
     */
    public push(callback) {
        return this.queue.push(callback);
    }

    /**
     * Get the length of the queue.
     * @return {void}
     */
    public length() {
        return this.queue.length();
    }

    public destroy() {
        return this.queue.kill();
    }
}
