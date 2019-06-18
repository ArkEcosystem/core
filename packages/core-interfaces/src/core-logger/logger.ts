export interface ILogger {
    make(): ILogger;
    getLogger<T = any>(): T;

    log(level: string, message: any): boolean;
    error(message: any): boolean;
    warn(message: any): boolean;
    info(message: any): boolean;
    debug(message: any): boolean;
    verbose(message: any): boolean;

    suppressConsoleOutput(suppress?: boolean): void;
}
