'use strict'

const apiHelpers = require('@arkecosystem/core-test-utils/lib/helpers/api')

class Helpers {
  async request (query) {
    const url = 'http://localhost:4005/graphql'
    const server = require('@arkecosystem/core-container').resolvePlugin('graphql')

    return apiHelpers.request(server, 'POST', url, {}, { query })
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
