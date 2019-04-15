export function transformPeer(model) {
    return {
        ip: model.ip,
        port: +model.port,
        version: model.version,
        height: model.state ? model.state.height : model.height,
        os: model.os,
        latency: model.latency,
    };
}
