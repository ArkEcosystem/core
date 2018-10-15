'use strict'

const createSignature = require('../../../lib/generators/transactions/signature')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

describe('Signature transaction', () => {
  it('should be a function', () => {
    expect(createSignature).toBeFunction()
  })

  const quantity = 4
  const transactions = createSignature(
    undefined,
    undefined,
    quantity
  )

  it('should return an array', () => {
    expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 signature objects', () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ type: TRANSACTION_TYPES.SECOND_SIGNATURE })
    }
  })
})
