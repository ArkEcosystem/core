import { Logger } from "../../contracts/kernel/log";
import { Manager } from "../../support/manager";
import { PinoLogger } from "./drivers";

/**
 * @export
 * @class LogManager
 * @extends {Manager<Logger>}
 */
export class LogManager extends Manager<Logger> {
    /**
     * Create an instance of the Pino driver.
     *
     * @protected
     * @returns {Promise<Logger>}
     * @memberof LogManager
     */
    protected async createPinoDriver(): Promise<Logger> {
        return this.app.resolve(PinoLogger).make();
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof LogManager
     */
    protected getDefaultDriver(): string {
        return "pino";
    }
}
