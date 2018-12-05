exports.getCacheTimeout = () => {
  const {
    generateTimeout,
  } = require('@arkecosystem/core-container').resolveOptions('api').cache

  return JSON.parse(generateTimeout)
}
