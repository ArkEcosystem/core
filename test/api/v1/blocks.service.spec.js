const chai = require('chai')
const { expect } = require('chai')

let base = 'http://localhost:4003'

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
  it('should return blocks based on id', () => {
    chai.request(base)
      .get(`/api/blocks/get?id=1877716674628308671`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.block.id).to.be.a('string')
        expect(res.body.block.height).to.be.a('number')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })

  it('should return block not found', () => {
    chai.request(base)
      .get(`/api/blocks/get?id=18777we16674628308671`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.error).to.be.a('string').contains('not found')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })
})

describe('GET api/blocks/?limit=XX', () => {
  it('should return 5 blocks', () => {
    chai.request(base)
      .get(`/api/blocks?limit=5`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.blocks).to.be.a('array')
        expect(res.body.blocks.length).to.equal(5)
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })

  it('should return limit error info', () => {
    chai.request(base)
      .get(`/api/blocks?limit=500`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(false)
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })


})




