"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_isempty_1 = __importDefault(require("lodash.isempty"));
const util_1 = require("util");
class AbstractLogger {
    constructor(options) {
        this.options = options;
        this.silentConsole = false;
        this.defaultLevels = {
            error: "error",
            warn: "warn",
            info: "info",
            debug: "debug",
            verbose: "verbose",
        };
    }
    getLogger() {
        return this.logger;
    }
    log(level, message) {
        if (this.silentConsole) {
            return false;
        }
        if (lodash_isempty_1.default(message)) {
            return false;
        }
        if (typeof message !== "string") {
            message = util_1.inspect(message, { depth: 1 });
        }
        this.logger[level](message);
        return true;
    }
    error(message) {
        return this.log(this.getLevel("error"), message);
    }
    warn(message) {
        return this.log(this.getLevel("warn"), message);
    }
    info(message) {
        return this.log(this.getLevel("info"), message);
    }
    debug(message) {
        return this.log(this.getLevel("debug"), message);
    }
    verbose(message) {
        return this.log(this.getLevel("verbose"), message);
    }
    suppressConsoleOutput(suppress = true) {
        this.silentConsole = suppress;
    }
    getLevel(level) {
        return { ...this.defaultLevels, ...this.getLevels() }[level];
    }
    getLevels() {
        return this.defaultLevels;
    }
}
exports.AbstractLogger = AbstractLogger;
//# sourceMappingURL=logger.js.map