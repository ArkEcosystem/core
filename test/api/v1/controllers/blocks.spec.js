const Helpers = require('../helpers')

describe('API 1.0 - Blocks', () => {
  describe('GET /api/blocks/get?id', () => {
    it('should return blocks based on id', (done) => {
      Helpers.request('GET', 'blocks/get', { id: '1877716674628308671' }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('block').which.is.an('object')
        res.body.block.should.have.property('id').which.is.a('string')
        res.body.block.should.have.property('height').which.is.a('number')

        done()
      })
    })

    it('should return block not found', (done) => {
      Helpers.request('GET', 'blocks/get', { id: '18777we16674628308671' }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string').and.contains('not found')

        done()
      })
    })
  })

  describe('GET /api/blocks/?limit=XX', () => {
    it('should return 5 blocks', (done) => {
      Helpers.request('GET', 'blocks', { limit: 5 }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('blocks').which.is.an('array').with.lengthOf(5)

        done()
      })
    })

    it('should return limit error info', (done) => {
      Helpers.request('GET', 'blocks', { limit: 500 }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('success').which.equals(false)
        res.body.should.have.property('error').which.is.a('string').and.contains('should be <= 100')

        done()
      })
    })
  })

  describe('GET /api/blocks/getfees', () => {
    it('should return matching fees with the config', (done) => {
      Helpers.request('GET', 'blocks/getFees').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('fees').which.is.an('object')

        // TODO adjust when environment setup properly
        // res.body.should.have.property('fees').which.equals(config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees)

        done()
      })
    })
  })

  describe('GET /api/blocks/getNethash', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'blocks/getNethash').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('nethash').which.is.an('string')

        // TODO adjust when environment setup properly
        // res.body.should.have.property('nethash').which.equals(config.network.nethash)

        done()
      })
    })
  })

  describe('GET /api/blocks/getMilestone', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'blocks/getMilestone').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('milestone').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/getReward', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'blocks/getReward').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('reward').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/getSupply', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'blocks/getSupply').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('supply').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/getStatus', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'blocks/getStatus').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('epoch').which.is.a('string')
        res.body.should.have.property('height').which.is.a('number')
        res.body.should.have.property('fee').which.is.a('number')
        res.body.should.have.property('milestone').which.is.a('number')
        res.body.should.have.property('nethash').which.is.a('string')
        res.body.should.have.property('reward').which.is.a('number')
        res.body.should.have.property('supply').which.is.a('number')

        done()
      })
    })
  })
})
