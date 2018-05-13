'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')

describe('API 1.0 - Blocks', () => {
  describe('GET /blocks/get?id', () => {
    it('should return blocks based on id', async () => {
      const res = await utils.request('GET', 'blocks/get', { id: genesisBlock.id })
      await utils.assertSuccessful(res)

      await expect(res.body.block).toBeObject()
      await expect(res.body.block.id).toBeString()
      await expect(res.body.block.height).toBeNumber()
    })

    it('should return block not found', async () => {
      const res = await utils.request('GET', 'blocks/get', { id: '18777we16674628308671' })
      await utils.assertError(res)

      await expect(res.body.error).toContain('not found')
    })
  })

  describe('GET /blocks?limit=XX', () => {
    it('should return 1 blocks', async () => {
      const res = await utils.request('GET', 'blocks', { limit: 1 })
      await utils.assertSuccessful(res)

      await expect(res.body.blocks).toHaveLength(1)
    })

    it('should return limit error info', async () => {
      const res = await utils.request('GET', 'blocks', { limit: 500 })
      await utils.assertError(res)

      await expect(res.body.success).toBeFalsy()
      await expect(res.body.error).toContain('should be <= 100')
    })
  })

  describe('GET /blocks/getfees', () => {
    it('should return matching fees with the config', async () => {
      const res = await utils.request('GET', 'blocks/getFees')
      await utils.assertSuccessful(res)

      await expect(res.body.fees).toBeObject()

      const container = require('@arkecosystem/core-container')
      const blockchain = container.resolvePlugin('blockchain')
      const config = container.resolvePlugin('config')

      await expect(res.body.fees).toEqual(config.getConstants(blockchain.getLastBlock(true).height).fees)
    })
  })

  describe('GET /blocks/getNethash', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getNethash')
      await utils.assertSuccessful(res)

      await expect(res.body.nethash).toBeString()

      const container = require('@arkecosystem/core-container')
      const config = container.resolvePlugin('config')

      await expect(res.body.nethash).toBe(config.network.nethash)
    })
  })

  describe('GET /blocks/getMilestone', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getMilestone')
      await utils.assertSuccessful(res)

      await expect(res.body.milestone).toBeNumber()
    })
  })

  describe('GET /blocks/getReward', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getReward')
      await utils.assertSuccessful(res)

      await expect(res.body.reward).toBeNumber()
    })
  })

  describe('GET /blocks/getSupply', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getSupply')
      await utils.assertSuccessful(res)

      await expect(res.body.supply).toBeNumber()
    })
  })

  describe('GET /blocks/getStatus', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getStatus')
      await utils.assertSuccessful(res)

      await expect(res.body.epoch).toBeString()
      await expect(res.body.height).toBeNumber()
      await expect(res.body.fee).toBeNumber()
      await expect(res.body.milestone).toBeNumber()
      await expect(res.body.nethash).toBeString()
      await expect(res.body.reward).toBeNumber()
      await expect(res.body.supply).toBeNumber()
    })
  })
})
