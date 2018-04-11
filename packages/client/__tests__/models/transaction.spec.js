import Transaction from '../../src/models/transaction'
import builder from '../../src/builder'
import cryptoBuilder from '../../src/builder/crypto'
import txData from './fixtures/transaction'

import configManager from '../../src/managers/config'
import network from '../../src/networks/ark/devnet'

const createRandomTx = type => {
  let tx

  switch (type) {
    case 0: // transfer
      tx = builder.transfer(
        'AMw3TiLrmVmwmFVwRzn96kkUsUpFTqsAEX',
        ~~(Math.random() * Math.pow(10, 10)),
        Math.random().toString(36),
        Math.random().toString(36),
        Math.random().toString(36)
      )
      break

    case 1: // second signature
      tx = builder.secondSignature(Math.random().toString(36), Math.random().toString(36))
      break

    case 2: // delegate registration
      tx = builder.delegate(Math.random().toString(36), Math.random().toString(12))
      break

    case 3: // vote registration
      tx = builder.vote(Math.random().toString(36), ['+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760'])
      break

    case 4: // multisignature registration
      const ECkeys = [1, 2, 3].map(() => {
        return cryptoBuilder.getKeys(Math.random().toString(36))
      })

      tx = builder.multisignature(Math.random().toString(36), '', ECkeys.map(k => k.Q), 48, 2)
      const hash = cryptoBuilder.getHash(tx, true, true)
      tx.signatures = ECkeys.slice(1).map(k => {
        k
          .sign(hash)
          .toDER()
          .toString('hex')
      })
  }

  tx.recipientId = txData.recipientId
  tx.senderPublicKey = txData.senderPublicKey
  tx.network = 0x17

  return tx
}

describe('Models - Transaction', () => {
  beforeEach(() => configManager.setConfig(network))

  describe('static fromBytes', () => {
    it('returns a new transaction', () => {
      // TODO the rest of transaction types
      // ;[0, 1, 2, 3, 4]
      ;[0]
        .map(type => createRandomTx(type))
        .map(tx => Transaction.serialise(tx).toString('hex'))
        .map(serialised => Transaction.fromBytes(serialised))

      const hex = Transaction.serialise(txData).toString('hex')
      const tx = Transaction.fromBytes(hex)

      expect(tx).toBeInstanceOf(Transaction)

      expect(tx.data.id).not.toEqual(txData.id)
      delete tx.data.id
      delete txData.id
      expect(tx.data).toEqual(txData)
    })
  })

  it('static deserialise', () => {})

  it('serialise', () => {})
})
