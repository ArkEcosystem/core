const handler = require('../../../lib/handlers/transactions/second-signature')

let wallet
let transaction

beforeEach(() => {
  wallet = {
    address: 'DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh',
    balance: '6453530000000',
    publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0',
    secondPublicKey: '03791c7d0229966ee41af0e5362f3bb2534ef8c706d7151fec70aead607227fce1'
  }

  transaction = {
    id: '7aec195f19341f47f981d7fae0b6745a5bae9378367c4314d2c7b963c8619141',
    blockid: '2613260468140896757',
    type: 1,
    timestamp: 36350407,
    amount: 0,
    fee: 500000000,
    senderId: 'DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh',
    senderPublicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0',
    signature: '304402207725a903fd345246d36a114a508040b99da0636705ab845ca05e0e91f5250d7b022073e53d9456512c9c4292c78a9d0f3c0cad296325dbae3f6432fbb8a4a63cc200', // eslint-disable-line max-len
    asset: {
      signature: {
        publicKey: '03791c7d0229966ee41af0e5362f3bb2534ef8c706d7151fec70aead607227fce1'
      }
    },
    confirmations: 19204
  }
})

describe.skip('SecondSignatureHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('SecondSignatureHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      expect(handler.canApply(wallet, transaction)).toBeTruthy()
    })

    it('should not be ok', () => {
      expect(handler.canApply(wallet, transaction)).toBeFalsy()
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
      handler.revert(wallet, transaction)

      expect(wallet.secondPublicKey).toBe('dummy')
    })
  })
})
