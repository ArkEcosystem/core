const utils = require('../utils')

describe('API 1.0 - Blocks', () => {
  describe('GET /api/blocks/get?id', () => {
    it('should return blocks based on id', (done) => {
      utils.request('GET', 'blocks/get', { id: '1877716674628308671' }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.block).toBeType('object')
        expect(res.body.block.id).toBeType('string')
        expect(res.body.block.height).toBeType('number')

        done()
      })
    })

    it('should return block not found', (done) => {
      utils.request('GET', 'blocks/get', { id: '18777we16674628308671' }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toContain('not found')

        done()
      })
    })
  })

  describe('GET /api/blocks/?limit=XX', () => {
    it('should return 5 blocks', (done) => {
      utils.request('GET', 'blocks', { limit: 5 }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.blocks).toHaveLength(5)

        done()
      })
    })

    it('should return limit error info', (done) => {
      utils.request('GET', 'blocks', { limit: 500 }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.success).toBeFalsy()
        expect(res.body.error).toContain('should be <= 100')

        done()
      })
    })
  })

  describe('GET /api/blocks/getfees', () => {
    it('should return matching fees with the config', (done) => {
      utils.request('GET', 'blocks/getFees').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.fees).toBeType('object')

        // TODO adjust when environment setup properly
        // expect(res.body.fees).toBe(config.getConstants(blockchain.getInstance().status.lastBlock.data.toBe.height).fees)

        done()
      })
    })
  })

  describe('GET /api/blocks/getNethash', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'blocks/getNethash').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.nethash).toBeType('string')

        // TODO adjust when environment setup properly
        // expect(res.body.nethash).toBe(config.toBe.network.nethash)

        done()
      })
    })
  })

  describe('GET /api/blocks/getMilestone', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'blocks/getMilestone').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.milestone).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/getReward', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'blocks/getReward').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.reward).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/getSupply', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'blocks/getSupply').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.supply).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/getStatus', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'blocks/getStatus').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.epoch).toBeType('string')
        expect(res.body.height).toBeType('number')
        expect(res.body.fee).toBeType('number')
        expect(res.body.milestone).toBeType('number')
        expect(res.body.nethash).toBeType('string')
        expect(res.body.reward).toBeType('number')
        expect(res.body.supply).toBeType('number')

        done()
      })
    })
  })
})
