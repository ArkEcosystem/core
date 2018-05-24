const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const feeManager = require('../../../lib/managers/fee')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().multiSignature()

  global.transaction = transaction
})

describe('Multi Signature Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('recipientId')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('asset')
  })

  describe('create', () => {
    const keysgroup = []
    const lifetime = 'TODO'
    const min = 'TODO'

    it('establishes the multi-signature asset', () => {
      transaction.create(keysgroup, lifetime, min)
      expect(transaction.asset.multisignature).toEqual({ keysgroup, lifetime, min })
    })

    it('calculates and establishes the fee based on the number of key groups', () => {
      const multiSignatureFee = feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)

      transaction.create(keysgroup, lifetime, min)
      expect(transaction.fee).toEqual(multiSignatureFee)

      keysgroup.push('key 1')
      keysgroup.push('key 2')
      transaction.create(keysgroup, lifetime, min)
      expect(transaction.fee).toEqual(3 * multiSignatureFee)
    })
  })

  describe('sign', () => {
    it('establishes the recipient id', () => {
      const pass = 'dummy pass'

      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()

      transaction.sign(pass)
      expect(transaction.recipientId).toBe('DKNJwdxrPQg6xXbrpaQLfgi6kC2ndaz8N5')
    })
  })
})
