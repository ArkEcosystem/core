import os from "os";

/**
 * Checks if IP belongs to local computer (all network interfaces are checked)
 * @param {String} ipAddress to check
 * @returns {Boolean} true/false
 */
export = (ipAddress) => {
  const interfaces = os.networkInterfaces();

  return Object.keys(interfaces).some((ifname) =>
    interfaces[ifname].some((iface) => iface.address === ipAddress),
  );
};
