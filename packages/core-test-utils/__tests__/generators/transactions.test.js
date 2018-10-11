'use strict'

const generateTransactions = require('../../lib/generators/transactions/transaction')
const { TRANSACTION_TYPES } = require('../../../crypto/lib/constants')

describe('generateTransactions', () => {
  it('should be a function', () => {
    expect(generateTransactions).toBeFunction()
  })

  it('should create transfer transactions for devnet', () => {
    const devnetAddress = 'DJQL8LWj81nRJNv9bbUgNXXELcB3q5qjZH'
    const transactions = generateTransactions(
      'devnet',
      TRANSACTION_TYPES.TRANSFER,
      undefined,
      devnetAddress
    )

    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ recipientId: devnetAddress })
    }
  })
})
