const os = require('os')
/**
 * Checks if IP belongs to local computer (all network interfaces are checked)
 * @param {String} ipAddress to check
 * @returns {Boolean} true/false
 */
module.exports = function (ipAddress) {
  const interfaces = os.networkInterfaces()

  return Object.keys(interfaces).some(function (ifname) {
    return interfaces[ifname].some(function (iface) {
      return iface.address === ipAddress
    })
  })
}
