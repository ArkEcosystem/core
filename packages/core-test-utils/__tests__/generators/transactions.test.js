'use strict'

const generateTransactions = require('../../lib/generators/transactions')
const transactionMethods = require('../../lib/generators/transactions/index')
const { TRANSACTION_TYPES } = require('../../../client/lib/constants')


describe('generateTransactions', () => {
  it('should be function', async () => {
    await expect(generateTransactions).toBeFunction()
  })
})

describe('Transfer transaction', () => {
  it('should be function', async () => {
    await expect(transactionMethods.transfer).toBeFunction()
  })

  const quantity = 4
  const transactions = transactionMethods.transfer(null, null, null, 2, quantity)

  it('should return an array', async () => {
    await expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array transfer objects', async () => {
    const quantity = 4
    for (let i = 0; i < transactions.length; i++) {
      await expect(transactions[i]).toMatchObject({type: TRANSACTION_TYPES.TRANSFER})
    }
  })
})
