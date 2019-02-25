import { AbstractLogger } from "@arkecosystem/core-logger";
import isEmpty from "lodash/isEmpty";
import pino from "pino";
import { multistream } from "pino-multi-stream";
import PinoPretty from "pino-pretty";
import { getPrettyStream } from "pino/lib/tools";
import rfs from "rotating-file-stream";
import { inspect } from "util";

export class PinoLogger extends AbstractLogger {
    public logger: pino.Logger;
    public silent: boolean = false;

    constructor(readonly options) {
        super(options);
    }

    public make() {
        this.logger = pino(
            this.options,
            multistream([
                { level: this.options.level, stream: this.getConsoleStream() },
                { level: this.options.level, stream: this.getFileStream() },
            ]),
        );

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

    private getConsoleStream() {
        return getPrettyStream(
            {
                levelFirst: false,
                translateTime: true,
                colorize: true,
            },
            PinoPretty,
            process.stdout,
        );
    }

    private getFileStream() {
        const withLeadingZero = (num: number) => (num > 9 ? "" : "0") + num;

        const createFileName = (time: Date) => {
            if (!time) {
                return new Date().toISOString().slice(0, 10) + ".log";
            }

            console.log(time.getMonth());

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
