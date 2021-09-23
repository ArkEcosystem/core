declare class Logger {
    private logger;
    constructor();
    setLogger(logger: any): void;
    error(message: any): void;
    warn(message: any): void;
    info(message: any): void;
    debug(message: any): void;
    verbose(message: any): void;
}
export declare const logger: Logger;
export {};
