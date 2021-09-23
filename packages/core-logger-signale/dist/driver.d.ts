import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { Signale } from "signale";
export declare class SignaleLogger extends AbstractLogger {
    protected logger: Signale;
    make(): Logger.ILogger;
    protected getLevels(): Record<string, string>;
}
