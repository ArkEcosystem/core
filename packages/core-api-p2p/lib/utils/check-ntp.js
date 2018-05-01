const Sntp = require('sntp')

module.exports = async (hosts) => {
  for (let i = 0; i < hosts.length; i++) {
    try {
      const time = await Sntp.time({ host: hosts[i] })

      return Promise.resolve({ time, host: hosts[i] })
    } catch (err) {
      console.log(err.message)
    }
  }

  Promise.reject(new Error('Please check your NTP connectivity, couldn\'t connect to any host.'))
}
