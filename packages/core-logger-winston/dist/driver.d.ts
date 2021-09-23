import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import "colors";
import * as winston from "winston";
export declare class WinstonLogger extends AbstractLogger {
    protected logger: winston.Logger;
    make(): Logger.ILogger;
    suppressConsoleOutput(suppress?: boolean): void;
    private registerTransports;
}
