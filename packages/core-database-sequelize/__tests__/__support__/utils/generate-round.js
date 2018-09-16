const { Bignum } = require('@arkecosystem/crypto')

module.exports = (delegates, round) => {
  const roundForgers = []

  for (let i = 0; i < delegates.length; i++) {
    roundForgers.push({
      round: round,
      publicKey: delegates[i],
      balance: Bignum.from('245098000000000')
    })
  }

  return roundForgers
}
