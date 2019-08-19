import { IApplication, ILogger } from "../../../contracts/core-kernel";
import { AbstractLogger } from "../logger";

export class ConsoleLogger extends AbstractLogger implements ILogger {
    /**
     * Create a new instance of the logger.
     *
     * @param {IApplication} app
     * @returns {Promise<ILogger>}
     * @memberof ConsoleLogger
     */
    public async make(app: IApplication): Promise<ILogger> {
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
