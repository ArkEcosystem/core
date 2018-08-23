const apiHelpers = require('@phantomchain/core-test-utils/lib/helpers/api')

class Helpers {
  async request(query) {
    const url = 'http://localhost:4005/graphql'
    const server = require('@phantomchain/core-container').resolvePlugin(
      'graphql',
    )

    return apiHelpers.request(server, 'POST', url, {}, { query })
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
