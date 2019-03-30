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

    constructor(protected readonly options: any) {}

    public abstract make(): Logger.ILogger;

    public error(message: any): void {
        this.createLog(this.getLevel("error"), message);
    }

    public warn(message: any): void {
        this.createLog(this.getLevel("warn"), message);
    }

    public info(message: any): void {
        this.createLog(this.getLevel("info"), message);
    }

    public debug(message: any): void {
        this.createLog(this.getLevel("debug"), message);
    }

    public verbose(message: any): void {
        this.createLog(this.getLevel("verbose"), message);
    }

    public suppressConsoleOutput(suppress: boolean): void {
        this.silentConsole = suppress;
    }

    protected getLevel(level: string): string {
        return { ...this.defaultLevels, ...this.getLevels() }[level];
    }

    protected getLevels(): Record<string, string> {
        return {};
    }

    private createLog(method: string, message: any): void {
        if (this.silentConsole) {
            return;
        }

        if (isEmpty(message)) {
            return;
        }

        if (typeof message !== "string") {
            message = inspect(message, { depth: 1 });
        }

        this.logger[method](message);
    }
}
