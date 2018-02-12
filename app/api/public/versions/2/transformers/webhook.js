module.exports = (model) => {
  return {
    id: model.id,
    event: model.event,
    target: model.target,
    secret: model.secret,
    enabled: model.enabled,
    conditions: model.conditions
  }
}
