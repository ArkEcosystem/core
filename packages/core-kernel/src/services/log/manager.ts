import { Logger } from "../../contracts/kernel/log";
import { AbstractManager } from "../../support/manager";
import { Console } from "./drivers";

/**
 * @export
 * @class LogManager
 * @extends {AbstractManager<Logger>}
 */
export class LogManager extends AbstractManager<Logger> {
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
