const { ARKTOSHI } = require('../constants')
const configManager = require('../managers/config')

/**
 * Get human readable string from arktoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
module.exports = (amount) => {
  let localeString = (+amount / ARKTOSHI).toLocaleString('en', { minimumFractionDigits: 8 })

  if (localeString.includes('.')) {
    while (localeString.slice(-1) === '0') {
      localeString = localeString.slice(0, -1)
    }

    if (localeString.slice(-1) === '.') {
      localeString = localeString.slice(0, -1)
    }
  }

  return `${localeString} ${configManager.config.client.symbol}`
}
