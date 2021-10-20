import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import chalk, { Chalk } from "chalk";
import * as console from "console";
import pino, { PrettyOptions } from "pino";
import PinoPretty from "pino-pretty";
import pump from "pump";
import pumpify from "pumpify";
import { Transform } from "readable-stream";
import { createStream } from "rotating-file-stream";
import split from "split2";
import { PassThrough, Writable } from "stream";
import { inspect } from "util";

/**
 * @export
 * @class PinoLogger
 * @implements {Contracts.Kernel.Logger}
 */
@Container.injectable()
export class PinoLogger implements Contracts.Kernel.Logger {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof PinoLogger
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.ConfigFlags)
    private readonly configFlags!: { processType: string };

    /**
     * @private
     * @type {Record<string, Chalk>}
     * @memberof PinoLogger
     */
    private readonly levelStyles: Record<string, Chalk> = {
        emergency: chalk.bgRed,
        alert: chalk.red,
        critical: chalk.red,
        error: chalk.red,
        warning: chalk.yellow,
        notice: chalk.green,
        info: chalk.blue,
        debug: chalk.magenta,
    };

    /**
     * @private
     * @type {PassThrough}
     * @memberof PinoLogger
     */
    private stream!: PassThrough;

    /**
     * @private
     * @type {Writable}
     * @memberof PinoLogger
     */
    private combinedFileStream?: Writable;

    /**
     * @private
     * @type {pino.Logger}
     * @memberof PinoLogger
     */
    private logger!: pino.Logger;

    /**
     * @private
     * @type {boolean}
     * @memberof PinoLogger
     */
    private silentConsole: boolean = false;

    /**
     * @param {*} options
     * @returns {Promise<Contracts.Kernel.Logger>}
     * @memberof PinoLogger
     */
    public async make(options?: any): Promise<Contracts.Kernel.Logger> {
        this.stream = new PassThrough();
        this.logger = pino(
            {
                base: null,
                // @ts-ignore
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
                formatters: {
                    level(label, number) {
                        return { level: label };
                    },
                },
                useOnlyCustomLevels: true,
                safe: true,
            },
            this.stream,
        );

        if (this.isValidLevel(options.levels.console)) {
            pump(
                this.stream,
                split(),
                // @ts-ignore - Object literal may only specify known properties, and 'colorize' does not exist in type 'PrettyOptions'.
                this.createPrettyTransport(options.levels.console, { colorize: true }),
                process.stdout,
                /* istanbul ignore next */
                (err) => {
                    console.error("Stdout stream closed due to an error:", err);
                },
            );
        }

        if (this.isValidLevel(options.levels.file)) {
            this.combinedFileStream = pumpify(
                split(),
                // @ts-ignore - Object literal may only specify known properties, and 'colorize' does not exist in type 'PrettyOptions'.
                this.createPrettyTransport(options.levels.file, { colorize: false }),
                this.getFileStream(options.fileRotator),
            );

            this.combinedFileStream!.on("error", (err) => {
                console.error("File stream closed due to an error:", err);
            });

            this.stream.pipe(this.combinedFileStream!);
        }

        return this;
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public emergency(message: any): void {
        this.log("emergency", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public alert(message: any): void {
        this.log("alert", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public critical(message: any): void {
        this.log("critical", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public error(message: any): void {
        this.log("error", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public warning(message: any): void {
        this.log("warning", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public notice(message: any): void {
        this.log("notice", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public info(message: any): void {
        this.log("info", message);
    }

    /**
     * @param {*} message
     * @memberof PinoLogger
     */
    public debug(message: any): void {
        this.log("debug", message);
    }

    /**
     * @param {boolean} suppress
     * @memberof PinoLogger
     */
    public suppressConsoleOutput(suppress: boolean): void {
        this.silentConsole = suppress;
    }

    public async dispose(): Promise<void> {
        if (this.combinedFileStream) {
            this.stream.unpipe(this.combinedFileStream);

            if (!this.combinedFileStream.destroyed) {
                this.combinedFileStream.end();

                return new Promise((resolve) => {
                    this.combinedFileStream!.on("finish", () => {
                        resolve();
                    });
                });
            }
        }
    }

    /**
     * @param {string} level
     * @param {*} message
     * @returns {boolean}
     * @memberof Logger
     */
    private log(level: string, message: any): void {
        if (this.silentConsole) {
            return;
        }

        if (Utils.isEmpty(message)) {
            return;
        }

        if (typeof message !== "string") {
            message = inspect(message, { depth: 1 });
        }

        this.logger[level](message);
    }

    /**
     * @private
     * @param {string} level
     * @param {PrettyOptions} [prettyOptions]
     * @returns {Transform}
     * @memberof PinoLogger
     */
    private createPrettyTransport(level: string, prettyOptions?: PrettyOptions): Transform {
        const pinoPretty = PinoPretty({
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

                    if (getLevel(json.level) <= getLevel(level)) {
                        const line: string | undefined = pinoPretty(json);

                        if (line !== undefined) {
                            return cb(undefined, line.replace("USERLVL", formatLevel(json.level)));
                        }
                    }
                } catch {}

                /* istanbul ignore next */
                return cb();
            },
        });
    }

    /**
     * @private
     * @param {{ interval: string }} options
     * @returns {Writable}
     * @memberof PinoLogger
     */
    private getFileStream(options: { interval: string }): Writable {
        return createStream(
            (time: number | Date, index?: number): string => {
                if (!time) {
                    return `${this.app.namespace()}-${this.configFlags.processType}-current.log`;
                }

                if (typeof time === "number") {
                    /* istanbul ignore next */
                    time = new Date(time);
                }

                let filename: string = time.toISOString().slice(0, 10);

                if (index && index > 1) {
                    filename += `.${index}`;
                }

                return `${this.app.namespace()}-${this.configFlags.processType}-${filename}.log.gz`;
            },
            {
                path: this.app.logPath(),
                initialRotation: true,
                interval: options.interval,
                maxSize: "100M",
                maxFiles: 10,
                compress: "gzip",
            },
        );
    }

    /**
     * @private
     * @param {string} level
     * @returns {boolean}
     * @memberof PinoLogger
     */
    private isValidLevel(level: string): boolean {
        return ["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"].includes(level);
    }
}
