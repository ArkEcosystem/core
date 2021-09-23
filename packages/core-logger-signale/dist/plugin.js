"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const driver_1 = require("./driver");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "logger",
    extends: "@arkecosystem/core-logger",
    async register(container, options) {
        return container.resolvePlugin("log-manager").createDriver(new driver_1.SignaleLogger(options));
    },
};
//# sourceMappingURL=plugin.js.map