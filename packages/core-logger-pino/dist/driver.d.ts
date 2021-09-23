import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import pino from "pino";
export declare class PinoLogger extends AbstractLogger {
    protected logger: pino.Logger;
    private fileStream;
    make(): Logger.ILogger;
    protected getLevels(): Record<string, string>;
    private createPrettyTransport;
    private getFileStream;
}
