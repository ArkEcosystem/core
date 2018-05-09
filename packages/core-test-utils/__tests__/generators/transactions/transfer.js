'use strict'

const createTransfer = require('../../lib/generators/transactions/transfer')
const { TRANSACTION_TYPES } = require('../../../client/lib/constants')

describe('Transfer transaction', () => {
  it('should be function', async () => {
    await expect(createTransfer).toBeFunction()
  })

  const arkAmount = 20
  const quantity = 4
  const transactions = createTransfer(
    undefined,
    undefined,
    undefined,
    arkAmount,
    quantity
  )

  it('should return an array', async () => {
    await expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of transfer objects', async () => {
    const quantity = 4
    for (let i = 0; i < transactions.length; i++) {
      await expect(transactions[i]).toMatchObject({type: TRANSACTION_TYPES.TRANSFER})
    }
  })

  it('should return an array sending 20 ark', async () => {
    const quantity = 4
    for (let i = 0; i < transactions.length; i++) {
      await expect(transactions[i]).toMatchObject({amount: arkAmount * Math.pow(10, 8)})
    }
  })
})
