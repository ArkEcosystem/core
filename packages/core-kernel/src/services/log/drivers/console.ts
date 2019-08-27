import { Logger as LoggerContract } from "../../../contracts/kernel/log";
import { Logger } from "../logger";
import { injectable } from "../../../container";

/**
 * @export
 * @class Console
 * @extends {Logger}
 * @implements {Logger}
 */
@injectable()
export class Console extends Logger implements LoggerContract {
    /**
     * Create a new instance of the Console driver.
     *
     * @returns {Promise<LoggerContract>}
     * @memberof Console
     */
    public async make(): Promise<LoggerContract> {
        this.logger = console;

        return this;
    }

    /**
     * @protected
     * @returns {Record<string, string>}
     * @memberof Console
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
