const mm = require('micromatch')

/**
 * Check if the given IP address is whitelisted.
 * @param  {[]String} value
 * @param  {String} value
 * @return {boolean}
 */
module.exports = (whitelist, value) => {
  if (Array.isArray(whitelist)) {
    for (let i = 0; i < whitelist.length; i++) {
      if (mm.isMatch(value, whitelist[i])) {
        return true
      }
    }
  }

  return false
}
