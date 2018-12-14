import { app } from "@arkecosystem/core-container";

export function transformPeerLegacy(model) {
    const config = app.resolvePlugin("config");

    const peer: any = {
        ip: model.ip,
        port: model.port,
        version: model.version,
        height: model.height,
        status: model.status,
        os: model.os,
        delay: model.delay,
    };

    if (config.network.name !== "mainnet") {
        peer.hashid = model.hashid;
    }

    return peer;
}
