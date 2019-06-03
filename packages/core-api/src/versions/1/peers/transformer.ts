import { app } from "@arkecosystem/core-container";

const port = +app.resolveOptions("p2p").server.port;

export const transformPeerLegacy = model => {
    return {
        ip: model.ip,
        port,
        ports: model.ports,
        version: model.version,
        height: model.height,
        delay: model.latency,
    };
};
