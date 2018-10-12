const Bignum = require('../../lib/utils/bignum')
const Wallet = require('../../lib/models/wallet')
const multiTx = require('./fixtures/multi-transaction')
const { ARKTOSHI } = require('../../lib/constants')
const configManager = require('../../lib/managers/config')
const network = require('../../lib/networks/ark/devnet.json')

describe('Models - Wallet', () => {
  beforeEach(() => configManager.setConfig(network))

  describe('toString', () => {
    // TODO implementation is right?
    it('returns the address and the balance', () => {
      const address = 'Abcde'
      const wallet = new Wallet(address)
      const balance = parseInt((Math.random() * 1000).toFixed(8))
      wallet.balance = new Bignum(balance * ARKTOSHI)
      expect(wallet.toString()).toBe(`${address} (${balance} ${configManager.config.client.symbol})`)
    })
  })

  describe('apply transaction', () => {
    const testWallet = new Wallet('D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7')
    const data = {
      publicKey: '02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece',
      secondPublicKey: '020d3c837d0a47ee7de1082cd48885003c5e92964e58bb34af3b58c6e42208ae03',
      balance: new Bignum(109390000000),
      vote: null,
      username: null,
      voteBalance: Bignum.ZERO,
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
      testWallet.balance = Bignum.ZERO
      testWallet.producedBlocks = 0
      testWallet.forgedFees = Bignum.ZERO
      testWallet.forgedRewards = Bignum.ZERO
      testWallet.lastBlock = null

      block = {
        id: 1,
        generatorPublicKey: testWallet.publicKey,
        reward: new Bignum(1000000000),
        totalFee: new Bignum(1000000000)
      }
    })

    it('should apply correct block', () => {
      testWallet.applyBlock(block)
      expect(testWallet.balance).toEqual(block.reward.plus(block.totalFee))
      expect(testWallet.producedBlocks).toBe(1)
      expect(testWallet.forgedFees).toEqual(block.totalFee)
      expect(testWallet.forgedRewards).toEqual(block.totalFee)
      expect(testWallet.lastBlock).toBeObject(block)
      expect(testWallet.dirty).toBeTruthy()
    })

    // Doesn't make sense anymore?
    it.skip('should apply correct block with string values', () => {
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
      expect(testWallet.balance).toEqual(originalWallet.balance)
      expect(testWallet.producedBlocks).toBe(0)
      expect(testWallet.forgedFees).toEqual(originalWallet.forgedFees)
      expect(testWallet.forgedRewards).toEqual(originalWallet.forgedRewards)
      expect(testWallet.lastBlock).toBe(originalWallet.lastBlock)
      expect(testWallet.dirty).toBeTruthy()
    })
  })
})
