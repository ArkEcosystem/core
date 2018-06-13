'use strict'

const axios = require('axios')

/**
 * Download the latest blocks.
 * @param  {Object}   message
 * @param  {Function} done
 * @return {*}
 */
module.exports = async (message, done) => {
  if (message.height) {
    const response = await axios.get(`${message.url}/peer/blocks`, {
      params: { lastBlockHeight: message.height },
      headers: message.headers,
      timeout: 60000
    })
    return done(response.data.blocks)
  }

  return done()
}
