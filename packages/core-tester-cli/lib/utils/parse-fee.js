const { Bignum } = require('@arkecosystem/crypto')

const randomFee = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

module.exports = (fee) => {
  if (typeof fee === 'string' && fee.indexOf('-') !== -1) {
    const feeRange = fee.split('-').map(f => new Bignum(f))
    if (feeRange[1] < feeRange[0]) {
      return feeRange[0]
    }

    return new Bignum(randomFee(feeRange[0], feeRange[1]))
  }

  return new Bignum(fee)
}
