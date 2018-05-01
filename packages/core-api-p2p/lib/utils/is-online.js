const util = require('util')
const dns = require('dns')

module.exports = async (servers) => {
  const lookupService = util.promisify(dns.lookupService);

  for (let i = 0; i < servers.length; i++) {
    try {
      await lookupService(servers[i], 53)

      return Promise.resolve()
    } catch (err) {
      console.log(err.message)
    }
  }

  return Promise.reject()
}
