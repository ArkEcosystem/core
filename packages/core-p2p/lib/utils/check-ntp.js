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
    for (const host of hosts) {
      try {
        const time = await Sntp.time({ host, timeout })

        return time.errno
          ? logger.error(`Host ${host} responsed with: ${time.message}`)
          : resolve({ time, host })
      } catch (err) {
        logger.error(`Host ${host} responsed with: ${err.message}`)
      }
    }

    reject(
      new Error(
        "Please check your NTP connectivity, couldn't connect to any host.",
      ),
    )
  })
}
