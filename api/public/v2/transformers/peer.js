class PeerTransformer {
  constructor(model) {
    return {
      ip: model.ip,
      port: model.port,
      version: model.version,
      height: model.height,
      status: model.status,
      latency: model.latency ? model.latency : 0,
    };
  }
}

module.exports = PeerTransformer
