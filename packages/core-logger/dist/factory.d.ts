import { Logger } from "@arkecosystem/core-interfaces";
export declare class LoggerFactory {
    make(driver: Logger.ILogger): Logger.ILogger;
    private logPaths;
}
