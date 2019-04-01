import { Logger } from "@arkecosystem/core-interfaces";
import { LoggerFactory } from "./factory";

export class LoggerManager {
    private readonly factory: LoggerFactory = new LoggerFactory();
    private readonly drivers: Map<string, Logger.ILogger> = new Map<string, Logger.ILogger>();

    public driver(name: string = "default"): Logger.ILogger {
        return this.drivers.get(name);
    }

    public createDriver(driver: Logger.ILogger, name: string = "default"): Logger.ILogger {
        this.drivers.set(name, this.factory.make(driver));

        return this.driver();
    }

    public getDrivers(): Map<string, Logger.ILogger> {
        return this.drivers;
    }

    public getFactory(): LoggerFactory {
        return this.factory;
    }
}
