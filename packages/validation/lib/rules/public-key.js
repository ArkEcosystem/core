const engine = require('../engine')

module.exports = (attributes) => {
  const { error, value } = engine.validate(attributes, engine.joi.arkPublicKey())

  return {
    data: value,
    passes: !error,
    fails: error
  }
}
