'use strict'

const popsicle = require('popsicle')

/**
 * Download the latest blocks.
 * @param  {Object}   message
 * @param  {Function} done
 * @return {*}
 */
module.exports = async (message, done) => {
  if (message.height) {
    const response = await popsicle
      .request({
        method: 'GET',
        url: message.url + '/peer/blocks?lastBlockHeight=' + message.height,
        headers: message.headers,
        timeout: 60000
      })
      .use(popsicle.plugins.parse('json'))

    return done(response)
  }

  return done()
}
