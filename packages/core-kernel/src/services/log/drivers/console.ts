import { ILogger } from "../../../contracts/kernel/log";
import { AbstractLogger } from "../logger";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class Console
 * @extends {AbstractLogger}
 * @implements {ILogger}
 */
@injectable()
export class Console extends AbstractLogger implements ILogger {
    /**
     * Create a new instance of the Console driver.
     *
     * @returns {Promise<ILogger>}
     * @memberof Console
     */
    public async make(): Promise<ILogger> {
        this.logger = console;

        return this;
    }

    /**
     * @protected
     * @returns {Record<string, string>}
     * @memberof AbstractLogger
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
