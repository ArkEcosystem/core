'use strict'

const createSignature = require('../../../lib/generators/transactions/signature')
const { TRANSACTION_TYPES } = require('../../../../client/lib/constants')

describe('Signature transaction', () => {
  it('should be function', async () => {
    await expect(createSignature).toBeFunction()
  })

  const quantity = 4
  const transactions = createSignature(
    undefined,
    undefined,
    quantity
  )

  it('should return an array', async () => {
    await expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 signature objects', async () => {
    for (let i = 0; i < transactions.length; i++) {
      await expect(transactions[i]).toMatchObject({type: TRANSACTION_TYPES.SECOND_SIGNATURE})
    }
  })
})
