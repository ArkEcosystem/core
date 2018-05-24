const handler = require('../../../lib/handlers/transactions/timelock-transfer')

let wallet
let transaction

beforeEach(() => {
  wallet = require('./__fixtures__/wallet')
  transaction = require('./__fixtures__/transaction')
})

describe('TimelockTransferHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('TimelockTransferHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      expect(handler.canApply(wallet, transaction)).toBeTruthy()
    })

    it('should not be ok', () => {
      transaction.senderPublicKey = 'p'.repeat(66)

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
