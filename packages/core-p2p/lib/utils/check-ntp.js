const Sntp = require('sntp')
const shuffle = require('lodash/shuffle')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

/**
 * Check if it is possible to connect to any NTP host.
 * @param {Array} hosts
 * @param {Number} [timeout = 1000]
 * @return {Promise}
 */
module.exports = (hosts, timeout = 1000) => {
  hosts = shuffle(hosts)

  return new Promise(async (resolve, reject) => {
    for (let i = hosts.length - 1; i >= 0; i--) {
      try {
        const time = await Sntp.time({ host: hosts[i], timeout })

        // @see https://github.com/hueniverse/sntp/issues/26
        if (time.errno) {
          logger.error(`Host ${hosts[i]} responsed with: ${time.message}`)
        } else {
          return resolve({ time, host: hosts[i] })
        }
      } catch (err) {
        logger.error(`Host ${hosts[i]} responsed with: ${err.message}`)
      }
    }

    reject(new Error('Please check your NTP connectivity, couldn\'t connect to any host.'))
  })
}
