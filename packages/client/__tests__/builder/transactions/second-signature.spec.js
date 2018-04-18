import ark from '../../../lib/client'
import cryptoBuilder from '../../../lib/builder/crypto'
import transactionTests from './__shared__/transaction'

let tx

beforeEach(() => {
  tx = ark.getBuilder().secondSignature()

  global.tx = tx
})

describe('Second Signature Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('asset')
  })

  describe('sign', () => {
    xit('establishes the signature on the asset', () => {
      cryptoBuilder.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      cryptoBuilder.sign = jest.fn()
      tx.sign('bad pass')
      expect(tx.asset.signature).toBe('bad pass public key')
    })
  })
})
