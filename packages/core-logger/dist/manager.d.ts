import { Logger } from "@arkecosystem/core-interfaces";
import { LoggerFactory } from "./factory";
export declare class LoggerManager {
    private readonly factory;
    private readonly drivers;
    driver(name?: string): Logger.ILogger;
    createDriver(driver: Logger.ILogger, name?: string): Logger.ILogger;
    getDrivers(): Map<string, Logger.ILogger>;
    getFactory(): LoggerFactory;
}
