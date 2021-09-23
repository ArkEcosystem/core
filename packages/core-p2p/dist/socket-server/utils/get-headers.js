"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
exports.getHeaders = () => {
    const headers = {
        version: core_container_1.app.getVersion(),
        port: core_container_1.app.resolveOptions("p2p").port,
        height: undefined,
    };
    if (core_container_1.app.has("blockchain")) {
        const lastBlock = core_container_1.app.resolvePlugin("blockchain").getLastBlock();
        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }
    return headers;
};
//# sourceMappingURL=get-headers.js.map