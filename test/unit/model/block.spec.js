const { expect } = require('chai')
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
    xit('stores the data', () => {
    })
    xit('verifies the block', () => {
    })
  })

  describe('getHeader', () => {
    it('returns the block data without the transactions', () => {
      // Ignore the verification for testing purposes
      sinon.stub(Block.prototype, 'verify')

      const block = new Block(data)

      expect(block.getHeader().height).to.eql(data.height)
      expect(block.getHeader().totalAmount).to.eql(data.totalAmount)
      expect(block.getHeader().totalFee).to.eql(data.totalFee)
      expect(block.getHeader().reward).to.eql(data.reward)

      expect(block.getHeader()).to.not.have.property('transactions')
    })
  })
})
