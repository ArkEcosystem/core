"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_logger_1 = require("@arkecosystem/core-logger");
const pino_1 = __importDefault(require("pino"));
const pino_pretty_1 = __importDefault(require("pino-pretty"));
const pump_1 = __importDefault(require("pump"));
const readable_stream_1 = require("readable-stream");
const rotating_file_stream_1 = __importDefault(require("rotating-file-stream"));
const split2_1 = __importDefault(require("split2"));
const stream_1 = require("stream");
class PinoLogger extends core_logger_1.AbstractLogger {
    make() {
        const stream = new stream_1.PassThrough();
        this.logger = pino_1.default({
            // tslint:disable-next-line: no-null-keyword
            base: null,
            safe: true,
            level: "trace",
        }, stream);
        this.fileStream = this.getFileStream();
        const consoleTransport = this.createPrettyTransport(this.options.levels.console, { colorize: true });
        const fileTransport = this.createPrettyTransport(this.options.levels.file, { colorize: false });
        pump_1.default(stream, split2_1.default(), consoleTransport, process.stdout);
        pump_1.default(stream, split2_1.default(), fileTransport, this.fileStream);
        return this;
    }
    getLevels() {
        return {
            verbose: "trace",
        };
    }
    createPrettyTransport(level, prettyOptions) {
        const pinoPretty = pino_pretty_1.default({
            ...{
                levelFirst: false,
                translateTime: "yyyy-mm-dd HH:MM:ss.l",
            },
            ...prettyOptions,
        });
        const levelValue = this.logger.levels.values[level];
        return new readable_stream_1.Transform({
            transform(chunk, enc, cb) {
                try {
                    const json = JSON.parse(chunk);
                    if (json.level >= levelValue) {
                        const line = pinoPretty(json);
                        if (line !== undefined) {
                            return cb(undefined, line);
                        }
                    }
                }
                catch (ex) {
                    //
                }
                return cb();
            },
        });
    }
    getFileStream() {
        return rotating_file_stream_1.default((time, index) => {
            if (!time) {
                return `${core_container_1.app.getName()}-current.log`;
            }
            let filename = time.toISOString().slice(0, 10);
            if (index > 1) {
                filename += `.${index}`;
            }
            return `${core_container_1.app.getName()}-${filename}.log.gz`;
        }, {
            path: process.env.CORE_PATH_LOG,
            initialRotation: true,
            interval: this.options.fileRotator ? this.options.fileRotator.interval : "1d",
            maxSize: "100M",
            maxFiles: 10,
            compress: "gzip",
        });
    }
}
exports.PinoLogger = PinoLogger;
//# sourceMappingURL=driver.js.map