import { Logger as LoggerContract } from "../../../contracts/kernel/log";
import { injectable } from "../../../ioc";
import { Logger } from "../logger";

/**
 * @export
 * @class ConsoleLogger
 * @extends {Logger}
 * @implements {Logger}
 */
@injectable()
export class ConsoleLogger extends Logger implements LoggerContract {
    /**
     * Create a new instance of the console driver.
     *
     * @returns {Promise<LoggerContract>}
     * @memberof ConsoleLogger
     */
    public async make(): Promise<LoggerContract> {
        this.setLevels({
            emergency: "error",
            alert: "error",
            critical: "error",
            error: "error",
            warning: "warn",
            notice: "info",
            info: "info",
            debug: "debug",
        });

        this.logger = console;

        return this;
    }
}
