import { Logger } from "../../contracts/kernel/log";
import { Manager } from "../../support/manager";
import { MemoryLogger } from "./drivers/memory";

/**
 * @export
 * @class LogManager
 * @extends {Manager<Logger>}
 */
export class LogManager extends Manager<Logger> {
    /**
     * Create an instance of the Memory driver.
     *
     * @protected
     * @returns {Promise<Logger>}
     * @memberof LogManager
     */
    protected async createMemoryDriver(): Promise<Logger> {
        return this.app.resolve(MemoryLogger).make();
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof LogManager
     */
    protected getDefaultDriver(): string {
        return "memory";
    }
}
