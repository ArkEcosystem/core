const handler = require('../../../lib/handlers/transactions/ipfs')

let wallet
let transaction

beforeEach(() => {
  wallet = require('./__fixtures__/wallet')
  transaction = require('./__fixtures__/transaction')
})

describe('IpfsHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('IpfsHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      expect(handler.canApply(wallet, transaction)).toBeTruthy()
    })

    it('should not be ok', () => {
      transaction.senderPublicKey = 'a'.repeat(66)

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
