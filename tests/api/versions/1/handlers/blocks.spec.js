const utils = require('../utils')

describe('API 1.0 - Blocks', () => {
  describe('GET /api/blocks/get?id', () => {
    it('should return blocks based on id', async () => {
      const res = await utils.request('GET', 'blocks/get', { id: '1877716674628308671' })
      await utils.assertSuccessful(res)

      await expect(res.body.block).toBeType('object')
      await expect(res.body.block.id).toBeType('string')
      await expect(res.body.block.height).toBeType('number')
    })

    it('should return block not found', async () => {
      const res = await utils.request('GET', 'blocks/get', { id: '18777we16674628308671' })
      await utils.assertError(res)

      await expect(res.body.error).toContain('not found')
    })
  })

  describe('GET /api/blocks?limit=XX', () => {
    it('should return 5 blocks', async () => {
      const res = await utils.request('GET', 'blocks', { limit: 5 })
      await utils.assertSuccessful(res)

      await expect(res.body.blocks).toHaveLength(5)
    })

    it('should return limit error info', async () => {
      const res = await utils.request('GET', 'blocks', { limit: 500 })
      await utils.assertError(res)

      await expect(res.body.success).toBeFalsy()
      await expect(res.body.error).toContain('should be <= 100')
    })
  })

  describe('GET /api/blocks/getfees', () => {
    it('should return matching fees with the config', async () => {
      const res = await utils.request('GET', 'blocks/getFees')
      await utils.assertSuccessful(res)

      await expect(res.body.fees).toBeType('object')

      // TODO adjust when environment setup properly
      // await expect(res.body.fees).toBe(config.getConstants(blockchain.getInstance().state.lastBlock.data.toBe.height).fees)
    })
  })

  describe('GET /api/blocks/getNethash', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getNethash')
      await utils.assertSuccessful(res)

      await expect(res.body.nethash).toBeType('string')

      // TODO adjust when environment setup properly
      // await expect(res.body.nethash).toBe(config.toBe.network.nethash)
    })
  })

  describe('GET /api/blocks/getMilestone', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getMilestone')
      await utils.assertSuccessful(res)

      await expect(res.body.milestone).toBeType('number')
    })
  })

  describe('GET /api/blocks/getReward', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getReward')
      await utils.assertSuccessful(res)

      await expect(res.body.reward).toBeType('number')
    })
  })

  describe('GET /api/blocks/getSupply', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getSupply')
      await utils.assertSuccessful(res)

      await expect(res.body.supply).toBeType('number')
    })
  })

  describe('GET /api/blocks/getStatus', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'blocks/getStatus')
      await utils.assertSuccessful(res)

      await expect(res.body.epoch).toBeType('string')
      await expect(res.body.height).toBeType('number')
      await expect(res.body.fee).toBeType('number')
      await expect(res.body.milestone).toBeType('number')
      await expect(res.body.nethash).toBeType('string')
      await expect(res.body.reward).toBeType('number')
      await expect(res.body.supply).toBeType('number')
    })
  })
})
