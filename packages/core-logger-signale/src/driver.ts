import { AbstractLogger } from "@arkecosystem/core-logger";
import isEmpty from "lodash.isempty";
import { Signale } from "signale";
import { inspect } from "util";

export class SignaleLogger extends AbstractLogger {
    public logger: Signale;
    public silent: boolean = false;

    public make() {
        this.logger = new Signale(this.options);

        return this;
    }

    public error(message: any): void {
        this.createLog("error", message);
    }

    public warn(message: any): void {
        this.createLog("warn", message);
    }

    public info(message: any): void {
        this.createLog("info", message);
    }

    public debug(message: any): void {
        this.createLog("debug", message);
    }

    public verbose(message: any): void {
        this.createLog("note", message);
    }

    public suppressConsoleOutput(suppress: boolean): void {
        this.silent = suppress;
    }

    private createLog(method: string, message: any): void {
        if (this.silent) {
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
