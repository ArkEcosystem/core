import { app } from "@arkecosystem/core-container";

export function transformPeerLegacy(model) {
    const config = app.getConfig();

    return {
        ip: model.ip,
        port: model.port,
        version: model.version,
        height: model.height,
        os: model.os,
        delay: model.latency,
    };
}
