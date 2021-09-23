"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_logger_1 = require("@arkecosystem/core-logger");
const signale_1 = require("signale");
class SignaleLogger extends core_logger_1.AbstractLogger {
    make() {
        this.logger = new signale_1.Signale(this.options);
        return this;
    }
    getLevels() {
        return {
            verbose: "note",
        };
    }
}
exports.SignaleLogger = SignaleLogger;
//# sourceMappingURL=driver.js.map