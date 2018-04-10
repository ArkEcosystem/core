import Wallet from '@/models/wallet'
import multiTx from './fixtures/multi-transaction'

import configManager from '@/managers/config'
import network from '@/networks/ark/devnet'

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
      votebalance: 0,
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
})
