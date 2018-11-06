const Bignum = require('../../../lib/utils/bignum')
const handler = require('../../../lib/handlers/transactions/second-signature')

let wallet
let transaction

beforeEach(() => {
  wallet = {
    address: 'DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh',
    balance: new Bignum('6453530000000'),
    publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0',
    secondPublicKey: '03791c7d0229966ee41af0e5362f3bb2534ef8c706d7151fec70aead607227fce1'
  }

  transaction = {
    version: 1,
    id: '5823017492ceedff074806baaa98034703242277af03822c96f1831b84e646e4',
    blockid: '18049953523739571613',
    type: 0,
    timestamp: 36350726,
    amount: new Bignum(5000000000),
    fee: new Bignum(10000000),
    senderId: 'DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh',
    recipientId: 'D92qxqLRYwTannfANNGFm138WTrhsq9RVi',
    senderPublicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0',
    signature: '3044022071d48f273ac2181dc03cdd9326bb93bc8260966089b6548b32ba9bcb3cc0912302205b9dbc037c789576728ae7ab80f050c697c7aa00ad98d11086353c7d03f9f013', // eslint-disable-line max-len
    signSignature: '3044022023791a170f5b44b9b11f7ca91af02519f241deb4b33e2bcda858df631e20e6d702200ced02b468543db5212ef9a53623fc87227125be4447c29c759c79100dc66544', // eslint-disable-line max-len
    secondSignature: '3044022023791a170f5b44b9b11f7ca91af02519f241deb4b33e2bcda858df631e20e6d702200ced02b468543db5212ef9a53623fc87227125be4447c29c759c79100dc66544', // eslint-disable-line max-len
    asset: {},
    confirmations: 19620
  }
})

describe('SecondSignatureHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('SecondSignatureHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      wallet.secondPublicKey = null

      expect(handler.canApply(wallet, transaction)).toBeTrue()
    })

    it('should not be ok', () => {
      expect(handler.canApply(wallet, transaction)).toBeFalse()
    })
  })

  describe('apply', () => {
    it('should be a function', () => {
      expect(handler.apply).toBeFunction()
    })

    it('should be ok', () => {
      transaction.asset.signature = {
        publicKey: 'dummy'
      }

      handler.apply(wallet, transaction)

      expect(wallet.secondPublicKey).toBe('dummy')
    })
  })

  describe('revert', () => {
    it('should be a function', () => {
      expect(handler.revert).toBeFunction()
    })

    it('should be ok', () => {
      wallet.secondPublicKey = 'fake-secondPublicKey'

      handler.revert(wallet, transaction)

      expect(wallet.secondPublicKey).toBeNull()
    })
  })
})
