'use strict'

const createTransfer = require('../../../lib/generators/transactions/transfer')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

describe('Transfer transaction', () => {
  it('should be a function', () => {
    expect(createTransfer).toBeFunction()
  })

  const amount = 20
  const quantity = 4
  const transactions = createTransfer(
    undefined,
    undefined,
    undefined,
    amount,
    quantity
  )

  it('should return an array', () => {
    expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 transfer objects', () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ type: TRANSACTION_TYPES.TRANSFER })
    }
  })

  it('should return an array sending 20 ark', () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ amount: amount * Math.pow(10, 8) })
    }
  })
})
