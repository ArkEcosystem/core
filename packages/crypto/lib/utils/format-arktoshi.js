const { ARKTOSHI } = require('../constants')
const configManager = require('../managers/config')

/**
 * Get human readable string from arktoshis
 * @param  {Number|String|Bignum} amount
 * @return {String}
 */
module.exports = (amount) => `${(+amount / ARKTOSHI).toLocaleString()} ${configManager.config.client.symbol}`
