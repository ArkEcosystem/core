import { Logger } from "../../contracts/kernel/log";
import { Manager } from "../../support/manager";
import { ConsoleLogger } from "./drivers";

/**
 * @export
 * @class LogManager
 * @extends {Manager<Logger>}
 */
export class LogManager extends Manager<Logger> {
    /**
     * Create an instance of the Console driver.
     *
     * @protected
     * @returns {Promise<Logger>}
     * @memberof LogManager
     */
    protected async createConsoleDriver(): Promise<Logger> {
        return this.app.resolve(ConsoleLogger).make();
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof LogManager
     */
    protected getDefaultDriver(): string {
        return "console";
    }
}
