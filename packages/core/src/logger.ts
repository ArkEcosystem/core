import * as logSymbols from "log-symbols";

class Logger {
    public info(message: string): void {
        console.log(logSymbols.info, message);
    }

    public success(message: string): void {
        console.log(logSymbols.success, message);
    }

    public warn(message: string): void {
        console.log(logSymbols.warning, message);
    }

    public error(message: string): void {
        console.log(logSymbols.error, message);
    }
}

export const logger = new Logger();
