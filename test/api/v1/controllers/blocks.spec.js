const { expect } = require('chai')
const Helpers = require('../helpers')

describe('GET api/blocks/get?id', () => {
  it('should return blocks based on id', (done) => {
    Helpers.request('blocks/get?id=1877716674628308671').end((err, res) => {
      Helpers.assertSuccessful(err, res)
      expect(res.body.block.id).to.be.a('string')
      expect(res.body.block.height).to.be.a('number')

      done()
    })
  })

  it('should return block not found', (done) => {
    Helpers.request('blocks/get?id=18777we16674628308671').end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.be.a('string').contains('not found')

      done()
    })
  })
})

describe('GET api/blocks/?limit=XX', () => {
  it('should return 5 blocks', (done) => {
    Helpers.request('blocks?limit=5').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.blocks).to.be.a('array')
      expect(res.body.blocks.length).to.equal(5)

      done()
    })
  })

  it('should return limit error info', (done) => {
    Helpers.request('blocks?limit=500').end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.success).to.be.equal(false)
      expect(res.body.error).to.be.a('string').contains('should be <= 100')

      done()
    })
  })
})

describe('GET /api/blocks/getfees', () => {
  it('should return matching fees with the config', (done) => {
    Helpers.request('blocks/getFees').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body).to.have.property('fees')

      // TODO adjust when environment setup properly
      // expect(res.body.fees).to.equal(config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees)

      done()
    })
  })
})

describe('GET /api/blocks/getNethash', () => {
  it('should be ok', (done) => {
    Helpers.request('blocks/getNethash').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.nethash).to.be.a('string')

      // TODO adjust when environment setup properly
      // expect(res.body.nethash).to.equal(config.network.nethash)

      done()
    })
  })
})

describe('GET /api/blocks/getMilestone', () => {
  it('should be ok', (done) => {
    Helpers.request('blocks/getMilestone').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.milestone).to.be.a('number')

      done()
    })
  })
})

describe('GET /api/blocks/getReward', () => {
  it('should be ok', (done) => {
    Helpers.request('blocks/getReward').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.reward).to.be.a('number')

      done()
    })
  })
})

describe('GET /api/blocks/getSupply', () => {
  it('should be ok', (done) => {
    Helpers.request('blocks/getSupply').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.supply).to.be.a('number')

      done()
    })
  })
})

describe('GET /api/blocks/getStatus', () => {
  it('should be ok', (done) => {
    Helpers.request('blocks/getStatus').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.epoch).to.be.a('string')
      expect(res.body.height).to.be.a('number')
      expect(res.body.fee).to.be.a('number')
      expect(res.body.milestone).to.be.a('number')
      expect(res.body.nethash).to.be.a('string')
      expect(res.body.reward).to.be.a('number')
      expect(res.body.supply).to.be.a('number')

      done()
    })
  })
})
