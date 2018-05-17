'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe.skip('API 2.0 - Statistics', () => {
  describe('GET /statistics/blockchain', () => {
    it('should GET the blockchain statistics', async () => {
      const response = await utils.request('GET', 'statistics/blockchain')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.supply).toBeObject()
      expect(response.body.data.supply.initial).toBeNumber()
      expect(response.body.data.supply.current).toBeNumber()

      expect(response.body.data.blocks).toBeObject()
      expect(response.body.data.blocks.forged).toBeNumber()
      expect(response.body.data.blocks.rewards).toBeNumber()

      expect(response.body.data.rewards).toBeObject()
      expect(response.body.data.rewards.start).toBeNumber()
      expect(response.body.data.rewards.total).toBeNumber()

      expect(response.body.data.productivity).toBeObject()
      expect(response.body.data.productivity.best.username).toBeString()
      expect(response.body.data.productivity.best.productivity).toBeString()

      expect(response.body.data.productivity.worst).toBeObject()
      expect(response.body.data.productivity.worst.username).toBeString()
      expect(response.body.data.productivity.worst.productivity).toBeString()
    })
  })

  // TODO: big performance impact, think about storing them in memory on boot
  describe.skip('GET /statistics/transactions', () => {
    it('should GET the transaction statistics', async () => {
      const response = await utils.request('GET', 'statistics/transactions')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.count).toBeNumber()
      expect(response.body.data.amount).toBeNumber()
      expect(response.body.data.fees).toBeNumber()
    })
  })

  // TODO: big performance impact, think about storing them in memory on boot
  describe.skip('GET /statistics/blocks', () => {
    it('should GET the block statistics', async () => {
      const response = await utils.request('GET', 'statistics/blocks')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.count).toBeNumber()
      expect(response.body.data.rewards).toBeNumber()
      expect(response.body.data.fees).toBeNumber()
    })
  })

  describe('GET /statistics/votes', () => {
    it('should GET the vote statistics', async () => {
      const response = await utils.request('GET', 'statistics/votes')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.count).toBeNumber()
      expect(response.body.data.amount).toBeNumber()
      expect(response.body.data.fees).toBeNumber()
    })
  })

  describe('GET /statistics/unvotes', () => {
    it('should GET the unvote statistics', async () => {
      const response = await utils.request('GET', 'statistics/unvotes')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.count).toBeNumber()
      expect(response.body.data.amount).toBeNumber()
      expect(response.body.data.fees).toBeNumber()
    })
  })
})
