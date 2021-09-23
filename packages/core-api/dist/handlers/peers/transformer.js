"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
exports.transformPeer = model => {
    return {
        ip: model.ip,
        port: +core_container_1.app.resolveOptions("p2p").server.port,
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
//# sourceMappingURL=transformer.js.map