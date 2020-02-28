import { Queue } from "../../contracts/kernel/queue";
import { injectable } from "../../ioc";
import { ClassManager } from "../../support/class-manager";
import { MemoryQueue } from "./drivers/memory";

/**
 * @export
 * @class QueueManager
 * @extends {ClassManager}
 */
@injectable()
export class QueueManager extends ClassManager {
    /**
     * Create an instance of the Memory driver.
     *
     * @protected
     * @returns {Promise<Logger>}
     * @memberof QueueManager
     */
    protected async createMemoryDriver(): Promise<Queue> {
        return this.app.resolve<Queue>(MemoryQueue).make();
    }

    /**
     * Get the default driver name.
     *
     * @protected
     * @returns {string}
     * @memberof ValidationManager
     */
    protected getDefaultDriver(): string {
        return "memory";
    }
}
