/**
 * Turns a "peer" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => ({
  ip: model.ip,
  port: model.port,
  version: model.version,
  height: model.height,
  status: model.status,
  os: model.os,
  delay: model.delay,
})
