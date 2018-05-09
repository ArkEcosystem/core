'use strict'

const createDelegate = require('../../../lib/generators/transactions/delegate')
const { TRANSACTION_TYPES } = require('../../../../client/lib/constants')

describe('Delegate transaction', () => {
  it('should be function', async () => {
    await expect(createDelegate).toBeFunction()
  })

  const quantity = 4
  const transactions = createDelegate(
    undefined,
    undefined,
    quantity
  )

  it('should return an array', async () => {
    await expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 delegate objects', async () => {
    for (let i = 0; i < transactions.length; i++) {
      await expect(transactions[i]).toMatchObject({type: TRANSACTION_TYPES.DELEGATE})
    }
  })
})
