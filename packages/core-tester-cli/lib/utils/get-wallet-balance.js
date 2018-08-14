const getWallet = require('./get-wallet')

module.exports = async (address) => {
  const wallet = await getWallet(address)

  if (wallet) {
      return +wallet.balance
  }

  return null
}
