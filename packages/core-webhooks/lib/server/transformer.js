/**
 * Turns a "webhooks" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => ({
  id: model.id,
  event: model.event,
  target: model.target,
  token: model.token,
  enabled: model.enabled,
  conditions: model.conditions,
})
