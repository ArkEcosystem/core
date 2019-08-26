import { ILogger } from "../../contracts/kernel/log";
import { AbstractManager } from "../../support/manager";
import { Console } from "./drivers";

/**
 * @export
 * @class LogManager
 * @extends {AbstractManager<ILogger>}
 */
export class LogManager extends AbstractManager<ILogger> {
    /**
     * Create an instance of the Console driver.
     *
     * @returns {Promise<ILogger>}
     * @memberof LogManager
     */
    public async createConsoleDriver(): Promise<ILogger> {
        return this.app.ioc.resolve(Console).make();
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
