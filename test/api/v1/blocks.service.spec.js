const chai = require('chai')
const { expect } = require('chai')

const config = require('../../../core/config')
const blockchain = requireFrom('core/blockchainManager')


const base = 'http://localhost:4003'

/*
  registrar.get('blocks', controller.index, schema.getBlocks)
    registrar.get('blocks/get', controller.show, schema.getBlock)
    registrar.get('blocks/getEpoch', controller.epoch)
    registrar.get('blocks/getHeight', controller.height)
    registrar.get('blocks/getNethash', controller.nethash)
    registrar.get('blocks/getFee', controller.fee)
    registrar.get('blocks/getFees', controller.fees)
    registrar.get('blocks/getMilestone', controller.milestone)
    registrar.get('blocks/getReward', controller.reward)
    registrar.get('blocks/getSupply', controller.supply)
    registrar.get('blocks/getStatus', controller.status)
 */

describe('GET api/blocks/get?id', () => {
  it('should return blocks based on id', (done) => {
    chai.request(base)
      .get(`/api/blocks/get?id=1877716674628308671`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.block.id).to.be.a('string')
        expect(res.body.block.height).to.be.a('number')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
        done()
      })
  })

  it('should return block not found', (done) => {
    chai.request(base)
      .get(`/api/blocks/get?id=18777we16674628308671`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(false)
        expect(res.body.error).to.be.a('string').contains('not found')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
        done()
      })
  })
})

describe('GET api/blocks/?limit=XX', () => {
  it('should return 5 blocks', (done) => {
    chai.request(base)
      .get(`/api/blocks?limit=5`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.blocks).to.be.a('array')
        expect(res.body.blocks.length).to.equal(5)
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
        done()
      })
  })

  it('should return limit error info', (done) => {
    chai.request(base)
      .get(`/api/blocks?limit=500`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(false)
        expect(res.body.error).to.be.a('string').contains('should be <= 100')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
        done()
      })
  })
})


describe('GET /api/blocks/getfees', () => {

  it('should return matching fees with the config', (done) => {
    chai.request(base)
      .get('/api/blocks/getFees')
      .end((err, res) => {
        expect(res).to.have.status(200)
        expect(res.body).to.have.property('success').to.be.ok
        expect(res.body).to.have.property('fees')
        // TODO adjust when environment setup properly
        //expect(res.body.fees).to.equal(config.getConstants(blockchain.getInstance().lastBlock.data.height).fees)

        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
        done()
    })
  })
})

describe('GET /api/blocks/getNethash',  () => {

  it('should be ok',  (done) => {
    chai.request(base)
      .get('/api/blocks/getNethash')
      .end((err, res) => {
        expect(res.body).to.have.property('success').to.be.ok
        expect(res.body).to.have.property('nethash').to.be.a('string')
        // TODO adjust when environment setup properly
       // expect(res.body.nethash).to.equal(config.network.nethash)
        done()
    })
  })
})

describe('GET /api/blocks/getMilestone',  () => {

  it('should be ok',  (done) => {
    chai.request(base)
      .get('/api/blocks/getMilestone')
      .end((err, res) => {
         expect(res.body).to.have.property('milestone').to.be.a('number')
         done()
    })
  })
})

describe('GET /api/blocks/getReward',  ()  =>{
  it('should be ok',  (done) => {
    chai.request(base)
      .get('/api/blocks/getReward')
      .end((err, res) => {
          expect(res.body).to.have.property('reward').to.be.a('number')
      done()
    })
  })
})

describe('GET /api/blocks/getSupply',  ()  => {
  it('should be ok',  (done) => {
    chai.request(base)
      .get('/api/blocks/getSupply')
      .end((err, res) => {
          expect(res.body).to.have.property('supply').to.be.a('number')
        done()
    })
  })
})

describe('GET /api/blocks/getStatus',  ()  => {
  it('should be ok',  (done) => {
    chai.request(base)
      .get('/api/blocks/getStatus')
      .end((err, res) => {
        expect(res.body).to.have.property('success').to.be.ok
        expect(res.body).to.have.property('epoch').to.be.a('string')
        expect(res.body).to.have.property('height').to.be.a('number')
        expect(res.body).to.have.property('fee').to.be.a('number')
        expect(res.body).to.have.property('milestone').to.be.a('number')
        expect(res.body).to.have.property('nethash').to.be.a('string')
        expect(res.body).to.have.property('reward').to.be.a('number')
        expect(res.body).to.have.property('supply').to.be.a('number')
        done()
    })
  })
})

