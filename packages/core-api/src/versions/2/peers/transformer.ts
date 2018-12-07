export default function(model) {
  return {
    ip: model.ip,
    port: +model.port,
    version: model.version,
    height: model.state ? model.state.height : model.height,
    status: model.status,
    os: model.os,
    latency: model.delay,
  };
}
