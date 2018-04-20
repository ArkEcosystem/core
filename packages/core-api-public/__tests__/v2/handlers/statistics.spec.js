'use strict';

const utils = require('../utils')

describe.skip('API 2.0 - Statistics', () => {
  describe('GET /statistics/blockchain', () => {
    it('should GET the blockchain statistics', async () => {
      const res = await utils.request('GET', 'statistics/blockchain')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.supply).toBeObject()
      await expect(res.body.data.supply.initial).toBeNumber()
      await expect(res.body.data.supply.current).toBeNumber()

      await expect(res.body.data.blocks).toBeObject()
      await expect(res.body.data.blocks.forged).toBeNumber()
      await expect(res.body.data.blocks.rewards).toBeNumber()

      await expect(res.body.data.rewards).toBeObject()
      await expect(res.body.data.rewards.start).toBeNumber()
      await expect(res.body.data.rewards.total).toBeNumber()

      await expect(res.body.data.productivity).toBeObject()
      await expect(res.body.data.productivity.best.username).toBeString()
      await expect(res.body.data.productivity.best.productivity).toBeString()

      await expect(res.body.data.productivity.worst).toBeObject()
      await expect(res.body.data.productivity.worst.username).toBeString()
      await expect(res.body.data.productivity.worst.productivity).toBeString()
    })
  })

  // TODO: big performance impact, think about storing them in memory on boot
  describe.skip('GET /statistics/transactions', () => {
    it('should GET the transaction statistics', async () => {
      const res = await utils.request('GET', 'statistics/transactions')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeNumber()
      await expect(res.body.data.amount).toBeNumber()
      await expect(res.body.data.fees).toBeNumber()
    })
  })

  // TODO: big performance impact, think about storing them in memory on boot
  describe.skip('GET /statistics/blocks', () => {
    it('should GET the block statistics', async () => {
      const res = await utils.request('GET', 'statistics/blocks')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeNumber()
      await expect(res.body.data.rewards).toBeNumber()
      await expect(res.body.data.fees).toBeNumber()
    })
  })

  describe('GET /statistics/votes', () => {
    it('should GET the vote statistics', async () => {
      const res = await utils.request('GET', 'statistics/votes')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeNumber()
      await expect(res.body.data.amount).toBeNumber()
      await expect(res.body.data.fees).toBeNumber()
    })
  })

  describe('GET /statistics/unvotes', () => {
    it('should GET the unvote statistics', async () => {
      const res = await utils.request('GET', 'statistics/unvotes')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.count).toBeNumber()
      await expect(res.body.data.amount).toBeNumber()
      await expect(res.body.data.fees).toBeNumber()
    })
  })
})
