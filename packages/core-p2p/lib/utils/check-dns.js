/* eslint no-await-in-loop: "off" */

const util = require('util')
const dns = require('dns')
const shuffle = require('lodash/shuffle')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

module.exports = async hosts => {
  hosts = shuffle(hosts)

  const lookupService = util.promisify(dns.lookupService)

  for (let i = hosts.length - 1; i >= 0; i--) {
    try {
      await lookupService(hosts[i], 53)

      return Promise.resolve(hosts[i])
    } catch (err) {
      logger.error(err.message)
    }
  }

  return Promise.reject(
    new Error(
      "Please check your network connectivity, couldn't connect to any host.",
    ),
  )
}
