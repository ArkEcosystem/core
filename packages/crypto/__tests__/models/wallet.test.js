const Wallet = require('../../lib/models/wallet')
const multiTx = require('./fixtures/multi-transaction')

const configManager = require('../../lib/managers/config')
const network = require('../../lib/networks/ark/devnet.json')

describe('Models - Wallet', () => {
  beforeEach(() => configManager.setConfig(network))

  describe('toString', () => {
    // TODO implementation is right?
    it('returns the address and the balance', () => {
      const address = 'Abcde'
      const wallet = new Wallet(address)
      const balance = parseFloat((Math.random() * 1000).toFixed(8))
      wallet.balance = balance * 10 ** 8

      expect(wallet.toString()).toBe(`${address}=${balance}`)
    })
  })

  describe('apply transaction', () => {
    const testWallet = new Wallet('D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7')
    const data = {
      publicKey: '02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece',
      secondPublicKey: '020d3c837d0a47ee7de1082cd48885003c5e92964e58bb34af3b58c6e42208ae03',
      balance: 109390000000,
      vote: null,
      username: null,
      voteBalance: 0,
      multisignature: null,
      dirty: false,
      producedBlocks: 0,
      missedBlocks: 0
    }

    xit('should be ok for a multi-transaction', () => {
      Object.keys(data).forEach(k => (testWallet[k] = data[k]))
      expect(testWallet.canApply(multiTx)).toBeTruthy()
    })
  })

  describe('apply block', () => {
    let testWallet
    let block

    beforeEach(() => {
      testWallet = new Wallet('D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7')
      testWallet.publicKey = '02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece'
      testWallet.balance = 0
      testWallet.producedBlocks = 0
      testWallet.forgedFees = 0
      testWallet.forgedRewards = 0
      testWallet.lastBlock = null

      block = {
        id: 1,
        generatorPublicKey: testWallet.publicKey,
        reward: 1000000000,
        totalFee: 1000000000
      }
    })

    it('should apply correct block', () => {
      testWallet.applyBlock(block)
      expect(testWallet.balance).toBe(block.reward + block.totalFee)
      expect(testWallet.producedBlocks).toBe(1)
      expect(testWallet.forgedFees).toBe(block.totalFee)
      expect(testWallet.forgedRewards).toBe(block.totalFee)
      expect(testWallet.lastBlock).toBeObject(block)
      expect(testWallet.dirty).toBeTruthy()
    })

    it('should apply correct block with string values', () => {
      const originalBlock = Object.assign({}, block)
      block.reward += ''
      block.totalFee += ''
      block.reward += ''
      testWallet.applyBlock(block)
      expect(testWallet.balance).toBe(originalBlock.reward + originalBlock.totalFee)
      expect(testWallet.producedBlocks).toBe(1)
      expect(testWallet.forgedFees).toBe(originalBlock.totalFee)
      expect(testWallet.forgedRewards).toBe(originalBlock.totalFee)
      expect(testWallet.lastBlock).toBeObject(originalBlock)
      expect(testWallet.dirty).toBeTruthy()
    })

    it('should not apply incorrect block', () => {
      block.generatorPublicKey = 'a'.repeat(66)
      const originalWallet = Object.assign({}, testWallet)
      testWallet.applyBlock(block)
      expect(testWallet.balance).toBe(originalWallet.balance)
      expect(testWallet.producedBlocks).toBe(0)
      expect(testWallet.forgedFees).toBe(originalWallet.forgedFees)
      expect(testWallet.forgedRewards).toBe(originalWallet.forgedRewards)
      expect(testWallet.lastBlock).toBe(originalWallet.lastBlock)
      expect(testWallet.dirty).toBeTruthy()
    })
  })
})
