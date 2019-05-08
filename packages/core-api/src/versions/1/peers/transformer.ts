export const transformPeerLegacy = model => {
    return {
        ip: model.ip,
        port: model.port,
        version: model.version,
        height: model.height,
        delay: model.latency,
    };
};
