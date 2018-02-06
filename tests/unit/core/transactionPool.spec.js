const TransactionPool = require('app/core/transactionPool')

describe('Core | TransactionPool', () => {
  describe('new', () => {
    it.skip('establish an empty pool', function () {
      const pool = new TransactionPool()
      pool.pool.toBe({})
    })
  })
})
