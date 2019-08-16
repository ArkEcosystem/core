import { Kernel } from "../../contracts";

/**
 * @export
 * @class LoggerFactory
 */
export class LoggerFactory {
    /**
     * @param {Kernel.IApplication} app
     * @memberof LoggerFactory
     */
    public constructor(private readonly app: Kernel.IApplication) {}

    /**
     * @param {Kernel.ILogger} driver
     * @returns {Promise<Kernel.ILogger>}
     * @memberof LoggerFactory
     */
    public async make(driver: Kernel.ILogger): Promise<Kernel.ILogger> {
        const instance: Kernel.ILogger = await driver.make(this.app);

        // instance.debug(`${this.app.token()}/${this.app.network()}@${this.app.version()}`);

        // this.logPaths(instance);

        return instance;
    }

    // /**
    //  * @private
    //  * @param {Kernel.ILogger} driver
    //  * @memberof LoggerFactory
    //  */
    // private logPaths(driver: Kernel.ILogger): void {
    //     for (const [key, value] of Object.entries({
    //         Data: this.app.dataPath(),
    //         Config: this.app.configPath(),
    //         Cache: this.app.cachePath(),
    //         Log: this.app.logPath(),
    //         Temp: this.app.tempPath(),
    //     })) {
    //         driver.debug(`${key} Directory: ${value}`);
    //     }
    // }
}
