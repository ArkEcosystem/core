const Bignum = require('bigi')

module.exports = (joi) => ({
  name: 'bignumber',
  base: joi.object().type(Bignum)
})
