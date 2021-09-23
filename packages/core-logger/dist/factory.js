"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
class LoggerFactory {
    make(driver) {
        const instance = driver.make();
        instance.debug(`${core_container_1.app.getName()} ${core_container_1.app.getVersion()}`);
        this.logPaths(instance);
        return instance;
    }
    logPaths(driver) {
        for (const [key, value] of Object.entries({
            Data: process.env.CORE_PATH_DATA,
            Config: process.env.CORE_PATH_CONFIG,
            Cache: process.env.CORE_PATH_CACHE,
            Log: process.env.CORE_PATH_LOG,
            Temp: process.env.CORE_PATH_TEMP,
        })) {
            driver.debug(`${key} Directory: ${value}`);
        }
    }
}
exports.LoggerFactory = LoggerFactory;
//# sourceMappingURL=factory.js.map