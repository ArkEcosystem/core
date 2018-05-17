const engine = require('../engine')

module.exports = (attributes) => {
  const { error, value } = engine.validate(attributes, engine.joi.arkUsername())

  return {
    data: value,
    errors: error.details,
    passes: !error,
    fails: error
  }
}
