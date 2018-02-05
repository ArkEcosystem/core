module.exports = async (model) => {
  return {
    ip: model.ip,
    port: model.port,
    version: model.version,
    height: model.height,
    status: model.status,
    os: model.os,
    delay: model.delay
  };
}
