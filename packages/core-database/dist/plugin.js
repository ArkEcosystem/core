"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("./manager");
exports.plugin = {
    pkg: require("../package.json"),
    alias: "database-manager",
    async register(container, options) {
        container.resolvePlugin("logger").info("Starting Database Manager");
        return new manager_1.ConnectionManager();
    },
};
//# sourceMappingURL=plugin.js.map