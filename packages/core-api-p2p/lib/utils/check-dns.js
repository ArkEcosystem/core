const util = require('util')
const dns = require('dns')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

module.exports = async (servers) => {
  const lookupService = util.promisify(dns.lookupService);

  for (let i = 0; i < servers.length; i++) {
    try {
      await lookupService(servers[i], 53)

      return Promise.resolve(servers[i])
    } catch (err) {
      logger.error(err.message)
    }
  }

  Promise.reject(new Error('Please check your network connectivity, couldn\'t connect to any host.'))
}
