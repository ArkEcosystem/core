import Transaction from '../../src/models/transaction'
import builder from '../../src/builder'
import cryptoBuilder from '../../src/builder/crypto'
import ECPair from '../../src/crypto/ecpair'
import ECSignature from '../../src/crypto/ecsignature'
import txData from './fixtures/transaction'

import configManager from '../../src/managers/config'
import network from '../../src/networks/ark/devnet.json'

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

      tx = builder.multiSignature(Math.random().toString(36), '', ECkeys.map(k => k.Q), 48, 2)
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

const verifyEcdsaNonMalleability = (transaction) => {
  var ecurve = require('ecurve')
  var secp256k1 = ecurve.getCurveByName('secp256k1')
  var n = secp256k1.n
  var hash = cryptoBuilder.getHash(transaction, true, true)

  var signatureBuffer = Buffer.from(transaction.signature, 'hex')
  var senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
  var ecpair = ECPair.fromPublicKeyBuffer(senderPublicKeyBuffer, transaction.network)
  var ecsignature = ECSignature.fromDER(signatureBuffer)
  var ecs2 = ECSignature.fromDER(signatureBuffer)
  ecs2.s = n.subtract(ecs2.s)
  var res = ecpair.verify(hash, ecsignature)
  var res2 = ecpair.verify(hash, ecs2)
  return res === true && res2 === false
}

describe('Models - Transaction', () => {
  beforeEach(() => configManager.setConfig(network))

  describe('static fromBytes', () => {
    it('returns a new transaction', () => {
      [0, 1, 2, 3, 4].map(type => createRandomTx(type))
        .map(tx => {
          tx.network = 0x17
          tx.version = 1
          if (tx.vendorField) tx.vendorFieldHex = Buffer.from(tx.vendorField, 'utf8').toString('hex')
          if (tx.asset.delegate) delete tx.asset.delegate.publicKey
          if (tx.type === 0) {
            delete tx.asset
            tx.expiration = 0
          }
          if (tx.signSignature) tx.secondSignature = tx.signSignature
          if (!tx.recipientId) delete tx.recipientId
          return tx
        })
        .map(tx => {
          const newtx = Transaction.fromBytes(Transaction.serialize(tx).toString('hex'))
          expect(newtx.data).toEqual(tx)
          expect(newtx.verified).toBeTruthy()
        })
      let hex = Transaction.serialize(txData).toString('hex')
      let tx = Transaction.fromBytes(hex)
      expect(tx).toBeInstanceOf(Transaction)
      expect(tx.data).toEqual(txData)
    })
  })

  it('static deserialize', () => {})

  it('serialize', () => {})

  it('Signatures are not malleable', () => {
    [0, 1, 2, 3, 4]
      .map(type => createRandomTx(type))
      .map(tx => expect(verifyEcdsaNonMalleability(tx))
        .toBeTruthy())
  })
})
