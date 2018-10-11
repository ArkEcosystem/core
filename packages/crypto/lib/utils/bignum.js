const BigNumberJS = require('bignumber.js')

BigNumberJS.ZERO = new Bignum(0)
BigNumberJS.ONE = new Bignum(1)

BigNumberJS.config({
    DECIMAL_PLACES: 0,
    EXPONENTIAL_AT: 1e9
})

module.exports = BigNumberJS
