import { Logger } from "@arkecosystem/core-interfaces";
import isEmpty from "lodash.isempty";
import { inspect } from "util";

export abstract class AbstractLogger implements Logger.ILogger {
    protected logger: any;
    protected silentConsole: boolean = false;
    protected readonly defaultLevels: Record<string, string> = {
        error: "error",
        warn: "warn",
        info: "info",
        debug: "debug",
        verbose: "verbose",
    };

    constructor(protected readonly options: Record<string, any>) {}

    public abstract make(): Logger.ILogger;

    public getLogger<T = any>(): T {
        return this.logger;
    }

    public log(level: string, message: any): boolean {
        if (this.silentConsole) {
            return false;
        }

        if (isEmpty(message)) {
            return false;
        }

        if (typeof message !== "string") {
            message = inspect(message, { depth: 1 });
        }

        this.logger[level](message);

        return true;
    }

    public error(message: any): boolean {
        return this.log(this.getLevel("error"), message);
    }

    public warn(message: any): boolean {
        return this.log(this.getLevel("warn"), message);
    }

    public info(message: any): boolean {
        return this.log(this.getLevel("info"), message);
    }

    public debug(message: any): boolean {
        return this.log(this.getLevel("debug"), message);
    }

    public verbose(message: any): boolean {
        return this.log(this.getLevel("verbose"), message);
    }

    public suppressConsoleOutput(suppress: boolean = true): void {
        this.silentConsole = suppress;
    }

    protected getLevel(level: string): string {
        return { ...this.defaultLevels, ...this.getLevels() }[level];
    }

    protected getLevels(): Record<string, string> {
        return this.defaultLevels;
    }
}
