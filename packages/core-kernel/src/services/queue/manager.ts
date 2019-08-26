import { IQueue } from "../../contracts/kernel/queue";
import { AbstractManager } from "../../support/manager";
import { Memory } from "./drivers/memory";

/**
 * @export
 * @class QueueManager
 * @extends {AbstractManager<IQueue>}
 */
export class QueueManager extends AbstractManager<IQueue> {
    /**
     * Create an instance of the Memory driver.
     *
     * @returns {Promise<IQueue>}
     * @memberof QueueManager
     */
    public async createMemoryDriver(): Promise<IQueue> {
        return this.app.ioc.get<IQueue>(Memory);
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
