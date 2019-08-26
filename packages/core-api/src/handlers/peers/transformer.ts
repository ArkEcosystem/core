import { app } from "@arkecosystem/core-kernel";

export const transformPeer = model => {
    return {
        ip: model.ip,
        port: +app.get<any>("p2p.options").server.port,
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
