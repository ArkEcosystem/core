"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("./manager");
exports.plugin = {
    pkg: require("../package.json"),
    alias: "log-manager",
    async register() {
        return new manager_1.LoggerManager();
    },
};
//# sourceMappingURL=plugin.js.map