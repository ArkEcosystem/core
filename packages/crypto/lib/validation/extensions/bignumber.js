const Bignum = require('../../utils/bignum')

module.exports = (joi) => ({
  name: 'bignumber',
  base: joi.object().type(Bignum)
})
