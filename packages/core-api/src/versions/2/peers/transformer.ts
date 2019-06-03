export const transformPeer = model => {
    return {
        ip: model.ip,
        port: model.port,
        ports: model.ports,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        latency: model.latency,
    };
};
