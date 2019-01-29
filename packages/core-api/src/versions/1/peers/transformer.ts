import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p";

export function transformPeerLegacy(model) {
    const config = app.getConfig();

    const peer: any = {
        ip: model.ip,
        port: model.port,
        version: model.version,
        height: model.height,
        status: Peer.isOk(model) ? "OK" : "ERROR",
        os: model.os,
        delay: model.delay,
    };

    if (config.get("network.name") !== "mainnet") {
        peer.hashid = model.hashid;
    }

    return peer;
}
