'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')

describe('API 1.0 - Blocks', () => {
  describe('GET /blocks/get?id', () => {
    it('should return blocks based on id', async () => {
      const response = await utils.request('GET', 'blocks/get', { id: genesisBlock.id })
      utils.expectSuccessful(response)

      expect(response.body.block).toBeObject()
      expect(response.body.block.id).toBeString()
      expect(response.body.block.height).toBeNumber()
    })

    it('should return block not found', async () => {
      const response = await utils.request('GET', 'blocks/get', { id: '18777we16674628308671' })
      utils.expectError(response)

      expect(response.body.error).toContain('not found')
    })
  })

  describe('GET /blocks?limit=XX', () => {
    it('should return 1 blocks', async () => {
      const response = await utils.request('GET', 'blocks', { limit: 1 })
      utils.expectSuccessful(response)

      expect(response.body.blocks).toHaveLength(1)
    })

    it('should return limit error info', async () => {
      const response = await utils.request('GET', 'blocks', { limit: 500 })
      utils.expectError(response)

      expect(response.body.success).toBeFalsy()
      expect(response.body.error).toContain('should be <= 100')
    })
  })

  describe('GET /blocks/getfees', () => {
    it('should return matching fees with the config', async () => {
      const response = await utils.request('GET', 'blocks/getFees')
      utils.expectSuccessful(response)

      expect(response.body.fees).toBeObject()

      const container = require('@arkecosystem/core-container')
      const blockchain = container.resolvePlugin('blockchain')
      const config = container.resolvePlugin('config')

      expect(response.body.fees).toEqual(config.getConstants(blockchain.getLastBlock(true).height).fees)
    })
  })

  describe('GET /blocks/getNethash', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getNethash')
      utils.expectSuccessful(response)

      expect(response.body.nethash).toBeString()

      const container = require('@arkecosystem/core-container')
      const config = container.resolvePlugin('config')

      expect(response.body.nethash).toBe(config.network.nethash)
    })
  })

  describe('GET /blocks/getMilestone', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getMilestone')
      utils.expectSuccessful(response)

      expect(response.body.milestone).toBeNumber()
    })
  })

  describe('GET /blocks/getReward', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getReward')
      utils.expectSuccessful(response)

      expect(response.body.reward).toBeNumber()
    })
  })

  describe('GET /blocks/getSupply', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getSupply')
      utils.expectSuccessful(response)

      expect(response.body.supply).toBeNumber()
    })
  })

  describe('GET /blocks/getStatus', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getStatus')
      utils.expectSuccessful(response)

      expect(response.body.epoch).toBeString()
      expect(response.body.height).toBeNumber()
      expect(response.body.fee).toBeNumber()
      expect(response.body.milestone).toBeNumber()
      expect(response.body.nethash).toBeString()
      expect(response.body.reward).toBeNumber()
      expect(response.body.supply).toBeNumber()
    })
  })
})
