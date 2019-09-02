import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { WriteStream } from "fs";
import pino, { PrettyOptions } from "pino";
import PinoPretty from "pino-pretty";
import pump from "pump";
import { Transform } from "readable-stream";
import rfs from "rotating-file-stream";
import split from "split2";
import chalk, { Chalk } from "chalk";
import { PassThrough } from "stream";

@Container.injectable()
export class PinoLogger extends Services.Log.Logger implements Contracts.Kernel.Log.Logger {
    @Container.inject(Container.Identifiers.Application)
    private readonly app: Contracts.Kernel.Application;

    private fileStream: WriteStream;

    protected logger: pino.Logger;

    private levelStyles: Record<string, Chalk> = {
        emergency: chalk.bgRed,
        alert: chalk.red,
        critical: chalk.red,
        error: chalk.red,
        warning: chalk.yellow,
        notice: chalk.green,
        info: chalk.blue,
        debug: chalk.magenta,
    };

    public async make(options): Promise<Contracts.Kernel.Log.Logger> {
        const stream: PassThrough = new PassThrough();
        this.logger = pino(
            {
                base: null,
                customLevels: {
                    emergency: 0,
                    alert: 1,
                    critical: 2,
                    error: 3,
                    warning: 4,
                    notice: 5,
                    info: 6,
                    debug: 7,
                },
                level: "emergency",
                useLevelLabels: true,
                useOnlyCustomLevels: true,
                safe: true,
            },
            stream,
        );

        this.fileStream = this.getFileStream(options);

        const consoleTransport = this.createPrettyTransport(options.levels.console, { colorize: true });
        const fileTransport = this.createPrettyTransport(options.levels.file, { colorize: false });

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

        const getLevel = (level: string): number => this.logger.levels.values[level];
        const formatLevel = (level: string): string => this.levelStyles[level](level.toUpperCase());

        return new Transform({
            transform(chunk, enc, cb) {
                try {
                    const json = JSON.parse(chunk);

                    if (getLevel(json.level) >= getLevel(level)) {
                        const line: string | undefined = pinoPretty(json);

                        if (line !== undefined) {
                            return cb(undefined, line.replace("USERLVL", formatLevel(json.level)));
                        }
                    }
                } catch {}

                return cb();
            },
        });
    }

    private getFileStream(options): WriteStream {
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
                interval: options.fileRotator ? options.fileRotator.interval : "1d",
                maxSize: "100M",
                maxFiles: 10,
                compress: "gzip",
            },
        );
    }
}
