/* eslint max-len: "off" */

const os = require('os')
const ip = require("ipaddr.js")

/**
 * Checks if IP belongs to local computer (all network interfaces are checked)
 * @param {String} ipAddress to check
 * @returns {Boolean} true/false
 */
module.exports = ipAddress => {
  const interfaces = os.networkInterfaces()

  try {
    ipAddress = ip.parse(ipAddress).toString();
  } catch (error) {
    return true;
  }

  return (
    ipAddress.startsWith('127.') ||
    ipAddress.startsWith('0.') ||
    Object.keys(interfaces).some(ifname =>
      interfaces[ifname].some(iface => iface.address === ipAddress),
    )
  )
}
