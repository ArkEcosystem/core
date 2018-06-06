module.exports = (delegates, round) => {
  return delegates.map(delegate => ({
    round,
    publicKey: delegate,
    balance: '245098000000000'
  }))
}
