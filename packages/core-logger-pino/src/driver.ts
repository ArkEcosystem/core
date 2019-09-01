import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { WriteStream } from "fs";
import pino, { PrettyOptions } from "pino";
import PinoPretty from "pino-pretty";
import pump from "pump";
import { Transform } from "readable-stream";
import rfs from "rotating-file-stream";
import split from "split2";
import { PassThrough } from "stream";

@Container.injectable()
export class PinoLogger extends Services.Log.Logger implements Contracts.Kernel.Log.Logger {
    @Container.inject(Container.Identifiers.Application)
    private readonly app: Contracts.Kernel.Application;

    private fileStream: WriteStream;

    protected logger: pino.Logger;

    public async make(opts): Promise<Contracts.Kernel.Log.Logger> {
        this.setLevels({
            emergency: "fatal",
            alert: "fatal",
            critical: "fatal",
            error: "error",
            warning: "warn",
            notice: "info",
            info: "info",
            debug: "debug",
        });

        const stream: PassThrough = new PassThrough();
        this.logger = pino(
            {
                base: null,
                safe: true,
                level: "trace",
            },
            stream,
        );

        this.fileStream = this.getFileStream(opts);

        const consoleTransport = this.createPrettyTransport(opts.levels.console, { colorize: true });
        const fileTransport = this.createPrettyTransport(opts.levels.file, { colorize: false });

        pump(stream, split(), consoleTransport, process.stdout);
        pump(stream, split(), fileTransport, this.fileStream);

        return this;
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
                } catch {}

                return cb();
            },
        });
    }

    private getFileStream(opts): WriteStream {
        return rfs(
            (time: Date, index: number) => {
                if (!time) {
                    return `${this.app.namespace()}-current.log`;
                }

                let filename: string = time.toISOString().slice(0, 10);

                if (index > 1) {
                    filename += `.${index}`;
                }

                return `${this.app.namespace()}-${filename}.log.gz`;
            },
            {
                path: this.app.logPath(),
                initialRotation: true,
                interval: opts.fileRotator ? opts.fileRotator.interval : "1d",
                maxSize: "100M",
                maxFiles: 10,
                compress: "gzip",
            },
        );
    }
}
