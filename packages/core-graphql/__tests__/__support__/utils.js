const apiHelpers = require('@arkecosystem/core-test-utils/lib/helpers/api')
const { app } = require('@arkecosystem/core-container')

class Helpers {
  async request(query) {
    const url = 'http://localhost:4005/graphql'
    const server = app.resolvePlugin('graphql')

    return apiHelpers.request(server, 'POST', url, {}, { query })
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
