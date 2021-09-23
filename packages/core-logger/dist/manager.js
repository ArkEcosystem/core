"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const factory_1 = require("./factory");
class LoggerManager {
    constructor() {
        this.factory = new factory_1.LoggerFactory();
        this.drivers = new Map();
    }
    driver(name = "default") {
        return this.drivers.get(name);
    }
    createDriver(driver, name = "default") {
        this.drivers.set(name, this.factory.make(driver));
        return this.driver();
    }
    getDrivers() {
        return this.drivers;
    }
    getFactory() {
        return this.factory;
    }
}
exports.LoggerManager = LoggerManager;
//# sourceMappingURL=manager.js.map