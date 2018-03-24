const utils = require('../utils')

describe('API 2.0 - Statistics', () => {
  describe('GET /api/statistics/blockchain', () => {
    it('should GET the blockchain statistics', async () => {
      const res = await utils.request('GET', 'statistics/blockchain')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.supply).toBeType('object')
      await expect(res.body.data.supply.initial).toBeType('number')
      await expect(res.body.data.supply.current).toBeType('number')

      await expect(res.body.data.blocks).toBeType('object')
      await expect(res.body.data.blocks.forged).toBeType('number')
      await expect(res.body.data.blocks.rewards).toBeType('number')

      await expect(res.body.data.rewards).toBeType('object')
      await expect(res.body.data.rewards.start).toBeType('number')
      await expect(res.body.data.rewards.total).toBeType('number')

      await expect(res.body.data.productivity).toBeType('object')
      await expect(res.body.data.productivity.best.username).toBeType('string')
      await expect(res.body.data.productivity.best.productivity).toBeType('string')

      await expect(res.body.data.productivity.worst).toBeType('object')
      await expect(res.body.data.productivity.worst.username).toBeType('string')
      await expect(res.body.data.productivity.worst.productivity).toBeType('string')
    })
  })

  // @TODO: big performance impact, think about storing them in memory on boot
  describe.skip('GET /api/statistics/transactions', () => {
    it('should GET the transaction statistics', async () => {
      const res = await utils.request('GET', 'statistics/transactions')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeType('number')
      await expect(res.body.data.amount).toBeType('number')
      await expect(res.body.data.fees).toBeType('number')
    })
  })

  // @TODO: big performance impact, think about storing them in memory on boot
  describe.skip('GET /api/statistics/blocks', () => {
    it('should GET the block statistics', async () => {
      const res = await utils.request('GET', 'statistics/blocks')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeType('number')
      await expect(res.body.data.rewards).toBeType('number')
      await expect(res.body.data.fees).toBeType('number')
    })
  })

  describe('GET /api/statistics/votes', () => {
    it('should GET the vote statistics', async () => {
      const res = await utils.request('GET', 'statistics/votes')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeType('number')
      await expect(res.body.data.amount).toBeType('number')
      await expect(res.body.data.fees).toBeType('number')
    })
  })

  describe('GET /api/statistics/unvotes', () => {
    it('should GET the unvote statistics', async () => {
      const res = await utils.request('GET', 'statistics/unvotes')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeType('number')
      await expect(res.body.data.amount).toBeType('number')
      await expect(res.body.data.fees).toBeType('number')
    })
  })
})
