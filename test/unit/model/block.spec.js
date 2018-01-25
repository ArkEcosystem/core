const sinon = require('sinon')

const Block = require('model/block')

describe('Model | Block', () => {
  const data = {
    id: 1,
    height: 1,
    totalAmount: 10,
    totalFee: 1,
    reward: 1,
    transactions: []
  }

  describe('constructor', () => {
    it.skip('stores the data', () => {})
    it.skip('verifies the block', () => {})
  })

  describe('getHeader', () => {
    it('returns the block data without the transactions', () => {
      // Ignore the verification for testing purposes
      sinon.stub(Block.prototype, 'verify')

      const block = new Block(data)

      block.getHeader().height.should.equal(data.height)
      block.getHeader().totalAmount.should.equal(data.totalAmount)
      block.getHeader().totalFee.should.equal(data.totalFee)
      block.getHeader().reward.should.equal(data.reward)

      block.getHeader().should.not.have.property('transactions')
    })
  })
})
