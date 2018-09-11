'use strict'

const { Block, Wallet } = require('@arkecosystem/crypto').models
const { crypto } = require('@arkecosystem/crypto')

describe('Wallet Manager', () => {
  describe('apply block on mainnet', () => {
    const manager = new (require('@arkecosystem/core-database/lib/wallet-manager'))()
    const testWallet = new Wallet('ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38')
    testWallet.publicKey = '02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd'
    testWallet.balance = 109390000000
    manager.walletsByAddress[testWallet.address] = testWallet
    manager.walletsByPublicKey[testWallet.publicKey] = testWallet

    const delegate = new Wallet(crypto.getAddress('02fa6902e91e127d6d3410f6abc271a79ae24029079caa0db5819757e3c1c1c5a4', 0x17))
    delegate.publicKey = '02fa6902e91e127d6d3410f6abc271a79ae24029079caa0db5819757e3c1c1c5a4'
    manager.walletsByPublicKey[delegate.publicKey] = delegate

    const voted = new Wallet(crypto.getAddress('020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92', 0x17))
    voted.publicKey = '020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92'
    voted.username = 'test'
    manager.walletsByPublicKey[voted.publicKey] = voted
    manager.walletsByUsername['test'] = voted

    const block = {
      version: 0,
      timestamp: 25029544,
      height: 3084276,
      previousBlockHex: '63b315f3663e4299',
      previousBlock: '7184109965722665625',
      numberOfTransactions: 2,
      totalAmount: 0,
      totalFee: 600000000,
      reward: 200000000,
      payloadLength: 64,
      payloadHash: 'c2fa2d400b4c823873d476f6e0c9e423cf925e9b48f1b5706c7e2771d4095538',
      generatorPublicKey: '02fa6902e91e127d6d3410f6abc271a79ae24029079caa0db5819757e3c1c1c5a4',
      blockSignature: '30440220543f71d6f6445b703459b4f91d2c6f2446cbe6669e9c9008b1c77cc57073af2402206036fee3b434ffd5a31a579dd5b514a1c6384962291fda27b2463de903422834',
      id: '11773170219525190460',
      transactions: [
        {
          type: 3,
          network: 0x17,
          timestamp: 25028325,
          senderPublicKey: '02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd',
          fee: 100000000,
          amount: 0,
          asset: {
            votes: ['+020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92']
          },
          signature: '3045022100be28bdd7dc7117de903eccf97e3afbe87e1a32ee25b0b9bf814b35c6773ed51802202c8d62e708aa7afc08dbfcfd4640d105fe97337fb6145a8d916f2ce11c920255',
          recipientId: 'ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38',
          id: 'bace38ea544678f951cdd4abc269be24b4f5bab925ff6d5b480657952eb5aa65'
        }, {
          id: '7a1a43098cd253db395514220f69e3b99afaabb2bfcf5ecfa3b99727b367344b',
          network: 0x17,
          type: 1,
          timestamp: 25028279,
          fee: 500000000,
          amount: 0,
          senderPublicKey: '02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd',
          signature: '3044022071f4f5281ba7be76e43df4ea9e74f820da761e1f9f3b168b3a6e42c55ccf343a02203629d94845709e31be20943e2cd26637f0d8ccfb4a59764d45c161a942def069',
          asset: {
            signature: {
              publicKey: '02135e2ebd97d1f1ab5141b4269defc6e5650848062c40baaf869d72571526e6c6'
            }
          }
        }
      ]
    }
    it('should be ok to apply mainnet block height 3,084,276', () => {
      manager.applyBlock(new Block(block))
    })
  })
})
