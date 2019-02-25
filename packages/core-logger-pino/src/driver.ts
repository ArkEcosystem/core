import { AbstractLogger } from "@arkecosystem/core-logger";
import isEmpty from "lodash/isEmpty";
import pino from "pino";
import rfs from "rotating-file-stream";
import { inspect } from "util";

export class PinoLogger extends AbstractLogger {
    public logger: pino.Logger;
    public silent: boolean = false;

    constructor(readonly options) {
        super(options);
    }

    public make() {
        // @TODO add support for multistream
        this.logger = pino(this.options);
        // this.logger = pino(this.options, this.getWriteStream());

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
        this.createLog("trace", message);
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

    private getWriteStream() {
        const withLeadingZero = (num: number) => (num > 9 ? "" : "0") + num;

        const createFileName = (time: Date) => {
            if (!time) {
                return "core.log";
            }

            const year = withLeadingZero(time.getFullYear());
            const month = withLeadingZero(time.getMonth());
            const day = withLeadingZero(time.getDate());

            return `${year}-${month}-${day}.log`;
        };

        return rfs(createFileName, {
            path: process.env.CORE_PATH_LOG,
            interval: "1d",
            maxSize: "100M",
            maxFiles: 10,
        });
    }
}
