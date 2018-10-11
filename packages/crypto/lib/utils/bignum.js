const BigNumber = require('bignumber.js')

BigNumber.config({DECIMAL_PLACES: 0})

BigNumber.ZERO = new BigNumber(0)
BigNumber.ONE = new BigNumber(1)

module.exports = BigNumber
