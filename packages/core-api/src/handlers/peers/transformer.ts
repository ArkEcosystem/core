import { app } from "@arkecosystem/core-container";

const port = +app.resolveOptions("p2p").server.port;

export const transformPeer = model => {
    return {
        ip: model.ip,
        port,
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
