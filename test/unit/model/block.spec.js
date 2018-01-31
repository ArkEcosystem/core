const sinon = require('sinon')

const Block = require('../../../model/block')

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

      expect(block.getHeader().height).toBe(data.height)
      expect(block.getHeader().totalAmount).toBe(data.totalAmount)
      expect(block.getHeader().totalFee).toBe(data.totalFee)
      expect(block.getHeader().reward).toBe(data.reward)

      expect(block.getHeader()).not.toHaveProperty('transactions')
    })
  })
})
