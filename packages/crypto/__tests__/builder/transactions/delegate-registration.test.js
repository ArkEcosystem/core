const ark = require('../../../lib/client')
const crypto = require('../../../lib/crypto/crypto')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().delegateRegistration()

  global.transaction = transaction
})

describe('Delegate Registration Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('recipientId')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('asset')
  })

  it('should not have the username yet', () => {
    expect(transaction).not.toHaveProperty('username')
  })

  describe('create', () => {
    it('establishes the username', () => {
      transaction.create('homer')
      expect(transaction.asset.delegate.username).toBe('homer')
    })
  })

  describe('sign', () => {
    xit('establishes the public key of the delegate (on the asset property)', () => {
      crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      crypto.sign = jest.fn()
      transaction.sign('bad pass')
      expect(transaction.senderPublicKey).toBe('bad pass public key')
    })
  })

  // FIXME asset.delegate.username
  xdescribe('getStruct', () => {
    beforeEach(() => {
      transaction.senderPublicKey = '01'
      transaction.asset = { delegate: {} }
    })

    it('generates and returns the bytes as hex', () => {
      expect(transaction.getStruct().hex).toBe(crypto.getBytes(transaction).toString('hex'))
    })
    it('returns the id', () => {
      expect(transaction.getStruct().id).toBe(crypto.getId(transaction))
    })
    it('returns the signature', () => {
      expect(transaction.getStruct().signature).toBe(transaction.signature)
    })
    it('returns the second signature', () => {
      expect(transaction.getStruct().secondSignature).toBe(transaction.secondSignature)
    })
    it('returns the timestamp', () => {
      expect(transaction.getStruct().timestamp).toBe(transaction.timestamp)
    })
    it('returns the transaction type', () => {
      expect(transaction.getStruct().type).toBe(transaction.type)
    })
    it('returns the fee', () => {
      expect(transaction.getStruct().fee).toBe(transaction.fee)
    })
    it('returns the sender public key', () => {
      expect(transaction.getStruct().senderPublicKey).toBe(transaction.senderPublicKey)
    })

    it('returns the amount', () => {
      expect(transaction.getStruct().amount).toBe(transaction.amount)
    })
    it('returns the recipient id', () => {
      expect(transaction.getStruct().recipientId).toBe(transaction.recipientId)
    })
    it('returns the asset', () => {
      expect(transaction.getStruct().asset).toBe(transaction.asset)
    })
  })
})
