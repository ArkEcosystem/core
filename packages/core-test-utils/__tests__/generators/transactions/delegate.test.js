'use strict'

const createDelegate = require('../../../lib/generators/transactions/delegate')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

describe('Delegate transaction', () => {
  it('should be a function', () => {
    expect(createDelegate).toBeFunction()
  })

  const quantity = 4
  const transactions = createDelegate(
    undefined,
    undefined,
    quantity
  )

  it('should return an array', () => {
    expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 delegate objects', () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ type: TRANSACTION_TYPES.DELEGATE_REGISTRATION })
    }
  })
})
