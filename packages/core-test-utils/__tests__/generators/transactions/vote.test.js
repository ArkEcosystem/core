'use strict'

const createVote = require('../../../lib/generators/transactions/vote')
const { TRANSACTION_TYPES } = require('../../../../client/lib/constants')

describe('Vote transaction', () => {
  it('should be function', async () => {
    await expect(createVote).toBeFunction()
  })

  const quantity = 4
  const transactions = createVote(
    undefined,
    undefined,
    quantity
  )
  console.log(transactions)

  it('should return an array', async () => {
    await expect(transactions).toBeArrayOfSize(quantity)
  })

  it('should return an array of 4 vote objects', async () => {
    const quantity = 4
    for (let i = 0; i < transactions.length; i++) {
      console.log(transactions[i])
      await expect(transactions[i]).toMatchObject({type: TRANSACTION_TYPES.VOTE})
    }
  })
})
