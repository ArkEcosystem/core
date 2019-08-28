import { Queue } from "../../contracts/kernel/queue";
import { Manager } from "../../support/manager";
import { MemoryQueue } from "./drivers/memory";

/**
 * @export
 * @class QueueManager
 * @extends {Manager<Queue>}
 */
export class QueueManager extends Manager<Queue> {
    /**
     * Create an instance of the Memory driver.
     *
     * @returns {Promise<Queue>}
     * @memberof QueueManager
     */
    public async createMemoryDriver(): Promise<Queue> {
        return this.app.resolve<Queue>(MemoryQueue);
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof QueueManager
     */
    protected getDefaultDriver(): string {
        return "memory";
    }
}
