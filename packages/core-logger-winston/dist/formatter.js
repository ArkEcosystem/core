"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const dayjs_1 = __importDefault(require("dayjs"));
const winston_1 = require("winston");
exports.formatter = (colorOutput = true) => {
    const { colorize, combine, timestamp, printf } = winston_1.format;
    return combine(colorize(), timestamp(), printf(info => {
        // @ts-ignore
        let level = info[Symbol.for("level")].toUpperCase();
        let message = info.message || JSON.stringify(info.meta);
        if (colorOutput) {
            level = {
                error: chalk_1.default.bold.red(level),
                warn: chalk_1.default.bold.yellow(level),
                info: chalk_1.default.bold.blue(level),
                verbose: chalk_1.default.bold.cyan(level),
                debug: chalk_1.default.bold.white(level),
                silly: chalk_1.default.bold.magenta(level),
            }[level];
            message = {
                error: chalk_1.default.bold.bgRed(message),
                warn: chalk_1.default.bold.black.bgYellow(message),
                info: message,
                verbose: chalk_1.default.bold.cyan(message),
                debug: chalk_1.default.black.bgWhite(message),
                silly: chalk_1.default.bold.black.bgWhite(message),
            }[level];
        }
        const dateTime = dayjs_1.default(info.timestamp).format("YYYY-MM-DD HH:mm:ss");
        return `[${dateTime}][${level}]: ${message}`;
    }));
};
//# sourceMappingURL=formatter.js.map