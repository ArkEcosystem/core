const Sntp = require('sntp')

module.exports = async (hosts) => {
  for (let i = 0; i < hosts.length; i++) {
    try {
      const time = await Sntp.time({ host: hosts[i], timeout: 1000 })

      return Promise.resolve({ time, host: hosts[i] })
    } catch (err) {
      logger.error(`Host ${hosts[i]} responded with error: ${err.message}`)
    }
  }

  Promise.reject(new Error('Please check your NTP connectivity, couldn\'t connect to any host.'))
}
