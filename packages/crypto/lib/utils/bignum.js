const BigNumber = require('bignumber.js')

BigNumber.ZERO = new BigNumber(0)
BigNumber.ONE = new BigNumber(1)

BigNumber.config({
    DECIMAL_PLACES: 0,
    EXPONENTIAL_AT: 1e9
})

module.exports = BigNumber
