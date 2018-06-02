'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')

describe('API 1.0 - Blocks', () => {
  describe('GET /blocks/get?id', () => {
    it('should return blocks based on id', async () => {
      const response = await utils.request('GET', 'blocks/get', { id: genesisBlock.id })
      utils.expectSuccessful(response)

      expect(response.data.block).toBeObject()
      expect(response.data.block.id).toBeString()
      expect(response.data.block.height).toBeNumber()
    })

    it('should return block not found', async () => {
      const response = await utils.request('GET', 'blocks/get', { id: '18777we16674628308671' })
      utils.expectError(response)

      expect(response.data.error).toContain('not found')
    })
  })

  describe('GET /blocks?limit=XX', () => {
    it('should return 1 blocks', async () => {
      const response = await utils.request('GET', 'blocks', { limit: 1 })
      utils.expectSuccessful(response)

      expect(response.data.blocks).toHaveLength(1)
    })

    it('should return limit error info', async () => {
      const response = await utils.request('GET', 'blocks', { limit: 500 })
      utils.expectError(response)

      expect(response.data.success).toBeFalsy()
      expect(response.data.error).toContain('should be <= 100')
    })
  })

  describe('GET /blocks/getfees', () => {
    it('should return matching fees with the config', async () => {
      const response = await utils.request('GET', 'blocks/getFees')
      utils.expectSuccessful(response)

      expect(response.data.fees).toBeObject()

      expect(response.data.fees).toContainKeys([
        'delegate',
        'secondsignature',
        'delegate',
        'vote',
        'multisignature'
      ])
    })
  })

  describe('GET /blocks/getNethash', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getNethash')
      utils.expectSuccessful(response)

      expect(response.data.nethash).toBeString()

      const container = require('@arkecosystem/core-container')
      const config = container.resolvePlugin('config')

      expect(response.data.nethash).toBe(config.network.nethash)
    })
  })

  describe('GET /blocks/getMilestone', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getMilestone')
      utils.expectSuccessful(response)

      expect(response.data.milestone).toBeNumber()
    })
  })

  describe('GET /blocks/getReward', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getReward')
      utils.expectSuccessful(response)

      expect(response.data.reward).toBeNumber()
    })
  })

  describe('GET /blocks/getSupply', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getSupply')
      utils.expectSuccessful(response)

      expect(response.data.supply).toBeNumber()
    })
  })

  describe('GET /blocks/getStatus', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'blocks/getStatus')
      utils.expectSuccessful(response)

      expect(response.data.epoch).toBeString()
      expect(response.data.height).toBeNumber()
      expect(response.data.fee).toBeNumber()
      expect(response.data.milestone).toBeNumber()
      expect(response.data.nethash).toBeString()
      expect(response.data.reward).toBeNumber()
      expect(response.data.supply).toBeNumber()
    })
  })
})
