const { app } = require('@arkecosystem/core-container')

exports.getCacheTimeout = () => {
  const { generateTimeout } = app.resolveOptions('api').cache

  return JSON.parse(generateTimeout)
}
