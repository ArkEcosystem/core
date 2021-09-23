"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
exports.mountServer = async (name, server) => {
    try {
        await server.start();
        core_container_1.app.resolvePlugin("logger").info(`${name} Server running at: ${server.info.uri}`);
        return server;
    }
    catch (error) {
        core_container_1.app.forceExit(`Could not start ${name} Server!`, error);
    }
};
//# sourceMappingURL=mount.js.map