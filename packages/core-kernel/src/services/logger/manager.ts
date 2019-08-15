import { Kernel } from "../../contracts";
import { LoggerFactory } from "./factory";

/**
 * @export
 * @class LoggerManager
 */
export class LoggerManager {
    /**
     * @private
     * @type {LoggerFactory}
     * @memberof LoggerManager
     */
    private readonly factory: LoggerFactory;

    /**
     * @private
     * @type {Map<string, Kernel.ILogger>}
     * @memberof LoggerManager
     */
    private readonly drivers: Map<string, Kernel.ILogger> = new Map<string, Kernel.ILogger>();

    /**
     * @param {Kernel.IApplication} app
     * @memberof LoggerManager
     */
    public constructor(app: Kernel.IApplication) {
        this.factory = new LoggerFactory(app);
    }

    /**
     * @param {string} [name="default"]
     * @returns {Kernel.ILogger}
     * @memberof LoggerManager
     */
    public driver(name: string = "default"): Kernel.ILogger {
        return this.drivers.get(name);
    }

    /**
     * @param {Kernel.ILogger} driver
     * @param {string} [name="default"]
     * @returns {Kernel.ILogger}
     * @memberof LoggerManager
     */
    public createDriver(driver: Kernel.ILogger, name: string = "default"): Kernel.ILogger {
        this.drivers.set(name, this.factory.make(driver));

        return this.driver();
    }

    /**
     * @returns {Map<string, Kernel.ILogger>}
     * @memberof LoggerManager
     */
    public getDrivers(): Map<string, Kernel.ILogger> {
        return this.drivers;
    }

    /**
     * @returns {LoggerFactory}
     * @memberof LoggerManager
     */
    public getFactory(): LoggerFactory {
        return this.factory;
    }
}
