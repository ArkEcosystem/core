import { app } from "@arkecosystem/core-container";

export function transformPeer(model) {
    const config = app.getConfig();

    return {
        ip: model.ip,
        port: +model.port,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        os: model.os,
        latency: model.latency,
    };
}
