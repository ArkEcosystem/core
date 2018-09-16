/* eslint-disable */

const Bignum = require('../../../lib/utils/bignum')
const handler = require('../../../lib/handlers/transactions/multi-payment')

let wallet
let transaction

beforeEach(() => {
  wallet = require('./__fixtures__/wallet')

  transaction = {
    version: 1,
    id: '943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4',
    blockid: '11233167632577333611',
    type: 7,
    timestamp: 36482198,
    amount: new Bignum(100000000),
    fee: new Bignum(10000000),
    senderId: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    recipientId: 'DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh',
    senderPublicKey: '034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126',
    signature: '304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b', // eslint-disable-line max-len
    asset: {
      payments: [{
        amount: new Bignum(10)
      }, {
        amount: new Bignum(20)
      }, {
        amount: new Bignum(30)
      }, {
        amount: new Bignum(40)
      }, {
        amount: new Bignum(50)
      }]
    }
  }
})

describe('MultiPaymentHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('MultiPaymentHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      const amount = transaction.asset.payments.reduce((a, p) => (a.plus(p.amount)), Bignum.ZERO)

      expect(handler.canApply(wallet, transaction)).toBeTruthy()
    })

    it('should not be ok', () => {
      const amount = transaction.asset.payments.reduce((a, p) => (a.plus(p.amount)), Bignum.ZERO)
      wallet.balance = Bignum.ZERO

      expect(handler.canApply(wallet, transaction)).toBeFalsy()
    })
  })

  describe('apply', () => {
    it('should be a function', () => {
      expect(handler.apply).toBeFunction()
    })
  })

  describe('revert', () => {
    it('should be a function', () => {
      expect(handler.revert).toBeFunction()
    })
  })
})
