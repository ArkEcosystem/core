'use strict'

const createVote = require('../../../lib/generators/transactions/vote')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

describe('Vote transaction', () => {
  it('should be a function', () => {
    expect(createVote).toBeFunction()
  })

  const quantity = 4
  const transactions = createVote(
    undefined,
    undefined,
    quantity
  )

  it('should return an array', () => {
    expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 vote objects', () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ type: TRANSACTION_TYPES.VOTE })
    }
  })
})
