import { Kernel } from "../../contracts";
import { Manager } from "../../support/manager";
import { Console } from "./drivers";

export class LogManager extends Manager<Kernel.ILogger> {
    /**
     * Create an instance of the Console driver.
     *
     * @returns {Promise<Kernel.ILogger>}
     * @memberof LogManager
     */
    public async createConsoleDriver(): Promise<Kernel.ILogger> {
        return this.app.build(Console).make();
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
