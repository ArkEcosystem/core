const { Bignum } = require('@arkecosystem/crypto')

module.exports = (delegates, round) => {
  return delegates.map(delegate => ({
    round,
    publicKey: delegate,
    balance: new Bignum('245098000000000')
  }))
}
