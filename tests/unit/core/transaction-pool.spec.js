const TransactionQueue = require('../../../app/core/transaction-queue')

describe('Core | TransactionQueue', () => {
  describe('new', () => {
    it.skip('establish an empty pool', function () {
      const pool = new TransactionQueue()
      pool.pool.toBe({})
    })
  })
})
