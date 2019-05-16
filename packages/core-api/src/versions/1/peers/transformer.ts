export const transformPeerLegacy = model => {
    return {
        ip: model.ip,
        port: model.ports.p2p,
        ports: model.ports,
        version: model.version,
        height: model.height,
        delay: model.latency,
    };
};
