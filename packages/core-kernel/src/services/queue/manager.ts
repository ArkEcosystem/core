import { Kernel } from "../../contracts";
import { AbstractManager } from "../../support/manager";
import { Memory } from "./drivers/memory";

export class QueueManager extends AbstractManager<Kernel.IQueue> {
    /**
     * Create an instance of the Memory driver.
     *
     * @returns {Promise<Kernel.IQueue>}
     * @memberof QueueManager
     */
    public async createMemoryDriver(): Promise<Kernel.IQueue> {
        return this.app.build(Memory).make();
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
