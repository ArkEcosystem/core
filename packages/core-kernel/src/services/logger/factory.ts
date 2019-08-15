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
     * @returns {Kernel.ILogger}
     * @memberof LoggerFactory
     */
    public make(driver: Kernel.ILogger): Kernel.ILogger {
        const instance: Kernel.ILogger = driver.make();

        instance.debug(`${this.app.token()}/${this.app.network()}@${this.app.version()}`);
        this.logPaths(instance);

        return instance;
    }

    /**
     * @private
     * @param {Kernel.ILogger} driver
     * @memberof LoggerFactory
     */
    private logPaths(driver: Kernel.ILogger): void {
        for (const [key, value] of Object.entries({
            Data: process.env.CORE_PATH_DATA,
            Config: process.env.CORE_PATH_CONFIG,
            Cache: process.env.CORE_PATH_CACHE,
            Log: process.env.CORE_PATH_LOG,
            Temp: process.env.CORE_PATH_TEMP,
        })) {
            driver.debug(`${key} Directory: ${value}`);
        }
    }
}
