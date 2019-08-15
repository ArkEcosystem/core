import { app, Contracts } from "@arkecosystem/core-kernel";
import { WriteStream } from "fs";
import pino, { PrettyOptions } from "pino";
import PinoPretty from "pino-pretty";
import pump from "pump";
import { Transform } from "readable-stream";
import rfs from "rotating-file-stream";
import split from "split2";
import { PassThrough } from "stream";

export class PinoLogger extends AbstractLogger {
    protected logger: pino.Logger;
    private fileStream: WriteStream;

    public make(): Contracts.Kernel.ILogger {
        const stream: PassThrough = new PassThrough();
        this.logger = pino(
            {
                // tslint:disable-next-line: no-null-keyword
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

    protected getLevels(): Record<string, string> {
        return {
            verbose: "trace",
        };
    }

    private createPrettyTransport(level: string, prettyOptions?: PrettyOptions): Transform {
        const pinoPretty: PinoPretty = PinoPretty({
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
                            return cb(undefined, line);
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
        return rfs(
            (time: Date, index: number) => {
                if (!time) {
                    return `${app.getName()}-current.log`;
                }

                let filename: string = time.toISOString().slice(0, 10);

                if (index > 1) {
                    filename += `.${index}`;
                }

                return `${app.getName()}-${filename}.log.gz`;
            },
            {
                path: process.env.CORE_PATH_LOG,
                initialRotation: true,
                interval: this.options.fileRotator ? this.options.fileRotator.interval : "1d",
                maxSize: "100M",
                maxFiles: 10,
                compress: "gzip",
            },
        );
    }
}
