const { ARKTOSHI } = require('../constants')
const configManager = require('../managers/config')

/**
 * Get human readable string from arktoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
module.exports = amount => {
  const localeString = (+amount / ARKTOSHI).toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })

  return `${localeString} ${configManager.config.client.symbol}`
}
