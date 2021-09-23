import { Logger } from "@arkecosystem/core-interfaces";
export declare abstract class AbstractLogger implements Logger.ILogger {
    protected readonly options: Record<string, any>;
    protected logger: any;
    protected silentConsole: boolean;
    protected readonly defaultLevels: Record<string, string>;
    constructor(options: Record<string, any>);
    abstract make(): Logger.ILogger;
    getLogger<T = any>(): T;
    log(level: string, message: any): boolean;
    error(message: any): boolean;
    warn(message: any): boolean;
    info(message: any): boolean;
    debug(message: any): boolean;
    verbose(message: any): boolean;
    suppressConsoleOutput(suppress?: boolean): void;
    protected getLevel(level: string): string;
    protected getLevels(): Record<string, string>;
}
