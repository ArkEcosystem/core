import { Queue } from "../../contracts/kernel/queue";
import { AbstractManager } from "../../support/manager";
import { Memory } from "./drivers/memory";

/**
 * @export
 * @class QueueManager
 * @extends {AbstractManager<Queue>}
 */
export class QueueManager extends AbstractManager<Queue> {
    /**
     * Create an instance of the Memory driver.
     *
     * @returns {Promise<Queue>}
     * @memberof QueueManager
     */
    public async createMemoryDriver(): Promise<Queue> {
        return this.app.resolve<Queue>(Memory);
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
