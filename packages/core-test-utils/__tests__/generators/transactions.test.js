'use strict'

const generateTransactions = require('../../lib/generators/transactions')
const { TRANSACTION_TYPES } = require('../../../client/lib/constants')

describe('generateTransactions', () => {
  it('should be function', async () => {
    await expect(generateTransactions).toBeFunction()
  })

  it('should create transfer transactions for devnet', async () => {
    const devnetAddress = 'DJQL8LWj81nRJNv9bbUgNXXELcB3q5qjZH'
    const transactions = generateTransactions(
      'devnet',
      TRANSACTION_TYPES.TRANSFER,
      undefined,
      devnetAddress
    )
    for (let i = 0; i < transactions.length; i++) {
      await expect(transactions[i]).toMatchObject({recipientId: devnetAddress})
    }
  })
})
