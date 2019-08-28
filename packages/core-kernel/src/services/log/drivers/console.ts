import { Logger as LoggerContract } from "../../../contracts/kernel/log";
import { Logger } from "../logger";
import { injectable } from "../../../container";

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
        this.logger = console;

        return this;
    }

    /**
     * @protected
     * @returns {Record<string, string>}
     * @memberof ConsoleLogger
     */
    protected getLevels(): Record<string, string> {
        return {
            emergency: "error",
            alert: "error",
            critical: "error",
            error: "error",
            warning: "warn",
            notice: "info",
            info: "info",
            debug: "debug",
        };
    }
}
