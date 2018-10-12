const { bignumify } = require('@arkecosystem/core-utils')

module.exports = (delegates, round) => {
  return delegates.map(delegate => ({
    round,
    publicKey: delegate,
    balance: bignumify('245098000000000')
  }))
}
