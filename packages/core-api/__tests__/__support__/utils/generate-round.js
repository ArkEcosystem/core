const { Bignum } = require('@arkecosystem/crypto')

module.exports = (delegates, round) => {
  return delegates.map(delegate => ({
    round,
    publicKey: delegate,
    balance: Bignum.from('245098000000000')
  }))
}
