import { Logger } from "../../contracts/kernel/log";
import { Manager } from "../../support/manager";
import { Console } from "./drivers";

/**
 * @export
 * @class LogManager
 * @extends {Manager<Logger>}
 */
export class LogManager extends Manager<Logger> {
    /**
     * Create an instance of the Console driver.
     *
     * @returns {Promise<Logger>}
     * @memberof LogManager
     */
    public async createConsoleDriver(): Promise<Logger> {
        return this.app.resolve(Console).make();
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
