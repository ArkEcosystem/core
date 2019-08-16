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
}
