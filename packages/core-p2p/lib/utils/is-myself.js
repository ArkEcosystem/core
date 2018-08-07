const os = require('os')

/**
 * Checks if IP belongs to local computer (all network interfaces are checked)
 * @param {String} ipAddress to check
 * @returns {Boolean} true/false
 */
module.exports = ipAddress => {
  const interfaces = os.networkInterfaces()

  return Object.keys(interfaces).some(ifname => {
    return interfaces[ifname].some(iface => iface.address === ipAddress)
  })
}
