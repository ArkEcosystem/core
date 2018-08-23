exports.getCacheTimeout = () => {
  const {
    generateTimeout,
  } = require('@phantomchain/core-container').resolveOptions('api').cache

  return JSON.parse(generateTimeout)
}
