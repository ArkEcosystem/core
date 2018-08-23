/**
 * Turns a "config" object into readable object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = config => {
  const result = {}
  const keys = [
    '@phantomchain/core-p2p',
    '@phantomchain/core-api',
    '@phantomchain/core-graphql',
    '@phantomchain/core-json-rpc',
    '@phantomchain/core-webhooks',
  ]

  result[keys[0]] = config.plugins[keys[0]].port

  for (const [name, options] of Object.entries(config.plugins)) {
    if (keys.includes(name) && options.enabled) {
      if (options.server && options.server.enabled) {
        result[name] = options.server.port

        continue
      }

      result[name] = options.port
    }
  }

  return result
}
