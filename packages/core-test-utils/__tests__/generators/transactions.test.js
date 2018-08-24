const generateTransactions = require('../../lib/generators/transactions/transaction')
const { TRANSACTION_TYPES } = require('../../../crypto/lib/constants')

describe('generateTransactions', () => {
  it('should be a function', () => {
    expect(generateTransactions).toBeFunction()
  })

  it('should create transfer transactions for devnet', () => {
    const devnetAddress = 'PL2dXvNtTg2bHY88e4ihnNxjNoJiu3xbK4'
    const transactions = generateTransactions(
      'devnet',
      TRANSACTION_TYPES.TRANSFER,
      undefined,
      devnetAddress,
    )

    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ recipientId: devnetAddress })
    }
  })
})
