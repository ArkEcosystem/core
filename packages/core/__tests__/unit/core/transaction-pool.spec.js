const TransactionQueue = require('../../../src/transaction-queue')

describe('Core | TransactionQueue', () => {
  describe('new', () => {
    it('establish an empty pool', function () {
      const pool = new TransactionQueue()
      pool.pool.toBe({})
    })
  })
})
