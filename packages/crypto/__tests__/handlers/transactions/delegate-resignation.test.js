const handler = require('../../../lib/handlers/transactions/delegate-resignation')

let wallet
let transaction

beforeEach(() => {
  wallet = require('./__fixtures__/wallet')
  transaction = require('./__fixtures__/transaction')
})

describe('DelegateResignationHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('DelegateResignationHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be truth', () => {
      wallet.username = 'dummy'

      expect(handler.canApply(wallet, transaction, [])).toBeTrue()
    })

    it('should be false if wallet has no registered username', () => {
      wallet.username = null
      const errors = []

      expect(handler.canApply(wallet, transaction, errors)).toBeFalse()
      expect(errors).toContain('Wallet has not registered a username')
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
