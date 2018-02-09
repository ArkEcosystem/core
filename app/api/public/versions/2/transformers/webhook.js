module.exports = (model) => {
  return {
    id: model.id,
    event: model.event,
    enabled: model.enabled,
    options: model.options
  }
}
