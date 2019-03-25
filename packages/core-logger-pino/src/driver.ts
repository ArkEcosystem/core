import { AbstractLogger } from "@arkecosystem/core-logger";
import { WriteStream } from "fs";
import isEmpty from "lodash.isempty";
import pino, { PrettyOptions } from "pino";
import PinoPretty from "pino-pretty";
import pump from "pump";
import { Transform } from "readable-stream";
import rfs from "rotating-file-stream";
import split from "split2";
import { PassThrough } from "stream";
import { inspect } from "util";

export class PinoLogger extends AbstractLogger {
    public logger: pino.Logger;
    public silent: boolean = false;

    private fileStream: WriteStream;

    public make() {
        const stream = new PassThrough();
        this.logger = pino(
            {
                base: null,
                safe: true,
                level: "trace",
            },
            stream,
        );

        this.fileStream = this.getFileStream();

        const consoleTransport = this.createPrettyTransport(this.options.levels.console, { colorize: true });
        const fileTransport = this.createPrettyTransport(this.options.levels.file, { colorize: false });

        pump(stream, split(), consoleTransport, process.stdout);
        pump(stream, split(), fileTransport, this.fileStream);

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

    private createPrettyTransport(level: string, prettyOptions?: PrettyOptions): Transform {
        const pinoPretty = PinoPretty({
            ...{
                levelFirst: false,
                translateTime: "yyyy-mm-dd HH:MM:ss.l",
            },
            ...prettyOptions,
        });

        const levelValue = this.logger.levels.values[level];

        return new Transform({
            transform(chunk, enc, cb) {
                try {
                    const json = JSON.parse(chunk);
                    if (json.level >= levelValue) {
                        const line = pinoPretty(json);
                        if (line !== undefined) {
                            return cb(null, line);
                        }
                    }
                } catch (ex) {
                    //
                }

                return cb();
            },
        });
    }

    private getFileStream(): WriteStream {
        const createFileName = (time: Date, index: number) => {
            if (!time) {
                return new Date().toISOString().slice(0, 10) + ".log";
            }

            return `${time.toISOString().slice(0, 10)}.${index}.log.gz`;
        };

        return rfs(createFileName, {
            path: process.env.CORE_PATH_LOG,
            interval: "1d",
            maxSize: "100M",
            maxFiles: 10,
            compress: "gzip",
        });
    }
}
