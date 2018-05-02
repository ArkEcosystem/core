const Sntp = require('sntp')
const shuffle = require('lodash/shuffle')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

module.exports = async (hosts) => {
  hosts = shuffle(hosts)

  for (let i = hosts.length - 1; i >= 0; i--) {
    try {
      const time = await Sntp.time({ host: hosts[i], timeout: 1000 })

      return Promise.resolve({ time, host: hosts[i] })
    } catch (err) {
      logger.error(`Host ${hosts[i]} responsed with: ${err.message}`)
    }
  }

  Promise.reject(new Error('Please check your NTP connectivity, couldn\'t connect to any host.'))
}
