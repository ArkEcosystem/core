import chalk, { Chalk } from "chalk";
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

import { Application } from "../../../contracts/kernel";
import { Logger } from "../../../contracts/kernel/log";
import { Identifiers, inject, injectable } from "../../../ioc";
import { ConfigRepository } from "../../config";

@injectable()
export class PinoLogger implements Logger {
    /**
     * @private
     * @type {Application}
     * @memberof PinoLogger
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @private
     * @type {ConfigRepository}
     * @memberof PinoLogger
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository: ConfigRepository;

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
     * @type {WriteStream}
     * @memberof PinoLogger
     */
    private fileStream: WriteStream;

    /**
     * @private
     * @type {pino.Logger}
     * @memberof PinoLogger
     */
    private logger: pino.Logger;

    /**
     * @private
     * @type {boolean}
     * @memberof PinoLogger
     */
    private silentConsole: boolean = false;

    /**
     * @returns {Promise<Logger>}
     * @memberof PinoLogger
     */
    public async make(): Promise<Logger> {
        const options: any = this.configRepository.get("app.services.log");

        const stream: PassThrough = new PassThrough();
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
                useLevelLabels: true,
                useOnlyCustomLevels: true,
                safe: true,
            },
            stream,
        );

        this.fileStream = this.getFileStream(options.fileRotator);

        // @ts-ignore
        const consoleTransport = this.createPrettyTransport(options.levels.console, { colorize: true });
        // @ts-ignore
        const fileTransport = this.createPrettyTransport(options.levels.file, { colorize: false });

        pump(stream, split(), consoleTransport, process.stdout);
        pump(stream, split(), fileTransport, this.fileStream);

        return this;
    }

    /**
     * @param {string} level
     * @param {*} message
     * @returns {boolean}
     * @memberof Logger
     */
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

    /**
     * @private
     * @param {string} level
     * @param {PrettyOptions} [prettyOptions]
     * @returns {Transform}
     * @memberof PinoLogger
     */
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

                    /* istanbul ignore else */
                    if (getLevel(json.level) >= getLevel(level)) {
                        const line: string | undefined = pinoPretty(json);

                        /* istanbul ignore else */
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
     * @returns {WriteStream}
     * @memberof PinoLogger
     */
    private getFileStream(options: { interval: string }): WriteStream {
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
                interval: options.interval,
                maxSize: "100M",
                maxFiles: 10,
                compress: "gzip",
            },
        );
    }
}
