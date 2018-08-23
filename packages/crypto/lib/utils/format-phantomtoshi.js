const { PHANTOMTOSHI } = require('../constants')
const configManager = require('../managers/config')

/**
 * Get human readable string from phantomtoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
module.exports = amount => {
  const localeString = (+amount / PHANTOMTOSHI).toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })

  return `${localeString} ${configManager.config.client.symbol}`
}
