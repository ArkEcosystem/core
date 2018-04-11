import Ark from '../../../src'
import network from '../../../src/networks/ark/devnet.json'
import cryptoBuilder from '../../../src/builder/crypto'
import transactionTests from './__shared__/transaction'

let ark
let tx

beforeEach(() => {
  ark = new Ark(network)
  tx = ark.getBuilder().delegate()

  global.tx = tx
})

describe('Delegate Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('asset')
  })

  it('should not have the username yet', () => {
    expect(tx).not.toHaveProperty('username')
  })

  describe('create', () => {
    it('establishes the username', () => {
      tx.create('homer')
      expect(tx.username).toBe('homer')
    })
  })

  describe('sign', () => {
    xit('establishes the public key of the delegate (on the asset property)', () => {
      cryptoBuilder.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      cryptoBuilder.sign = jest.fn()
      tx.sign('bad pass')
      expect(tx.senderPublicKey).toBe('bad pass public key')
    })
  })

  // FIXME asset.delegate.username
  xdescribe('getStruct', () => {
    beforeEach(() => {
      tx.senderPublicKey = '01'
      tx.asset = { delegate: {} }
    })

    it('generates and returns the bytes as hex', () => {
      expect(tx.getStruct().hex).toBe(cryptoBuilder.getBytes(tx).toString('hex'))
    })
    it('returns the id', () => {
      expect(tx.getStruct().id).toBe(cryptoBuilder.getId(tx))
    })
    it('returns the signature', () => {
      expect(tx.getStruct().signature).toBe(tx.signature)
    })
    it('returns the second signature', () => {
      expect(tx.getStruct().secondSignature).toBe(tx.secondSignature)
    })
    it('returns the timestamp', () => {
      expect(tx.getStruct().timestamp).toBe(tx.timestamp)
    })
    it('returns the transaction type', () => {
      expect(tx.getStruct().type).toBe(tx.type)
    })
    it('returns the fee', () => {
      expect(tx.getStruct().fee).toBe(tx.fee)
    })
    it('returns the sender public key', () => {
      expect(tx.getStruct().senderPublicKey).toBe(tx.senderPublicKey)
    })

    it('returns the amount', () => {
      expect(tx.getStruct().amount).toBe(tx.amount)
    })
    it('returns the recipient id', () => {
      expect(tx.getStruct().recipientId).toBe(tx.recipientId)
    })
    it('returns the asset', () => {
      expect(tx.getStruct().asset).toBe(tx.asset)
    })
  })
})
