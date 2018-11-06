const Bignum = require('../../../lib/utils/bignum')
const handler = require('../../../lib/handlers/transactions/delegate-registration')

let wallet
let transaction

beforeEach(() => {
  wallet = require('./__fixtures__/wallet')

  transaction = {
    version: 1,
    id: '943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4',
    blockid: '11233167632577333611',
    type: 2,
    timestamp: 36482198,
    amount: Bignum.ZERO,
    fee: new Bignum(10000000),
    senderId: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    recipientId: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    senderPublicKey: '034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126',
    signature: '304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b', // eslint-disable-line max-len
    asset: {
      delegate: {
        username: 'dummy',
        publicKey: 'a'.repeat(66)
      }
    }
  }
})

describe('DelegateRegistrationHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('DelegateRegistrationHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      expect(handler.canApply(wallet, transaction)).toBeTrue()
    })

    it('should not be ok', () => {
      wallet.username = 'dummy'

      expect(handler.canApply(wallet, transaction)).toBeFalse()
    })
  })

  describe('apply', () => {
    it('should be a function', () => {
      expect(handler.apply).toBeFunction()
    })

    it('should be ok', () => {
      handler.apply(wallet, transaction)

      expect(wallet.username).toBe('dummy')
    })
  })

  describe('revert', () => {
    it('should be a function', () => {
      expect(handler.revert).toBeFunction()
    })

    it('should be ok', () => {
      handler.revert(wallet, transaction)

      expect(wallet.username).toBeNull()
    })
  })
})
