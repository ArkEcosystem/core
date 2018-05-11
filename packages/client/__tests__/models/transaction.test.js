const Transaction = require('../../lib/models/transaction')
const builder = require('../../lib/builder')
const cryptoBuilder = require('../../lib/builder/crypto')
const ECPair = require('../../lib/crypto/ecpair')
const ECSignature = require('../../lib/crypto/ecsignature')
const txData = require('./fixtures/transaction')

const configManager = require('../../lib/managers/config')
const network = require('../../lib/networks/ark/devnet.json')

const createRandomTx = type => {
  let tx

  switch (type) {
    case 0: // transfer
      tx = builder
        .transfer()
        .create('AMw3TiLrmVmwmFVwRzn96kkUsUpFTqsAEX', 1000 * Math.pow(10, 10))
        .setVendorField(Math.random().toString(36))
        .sign(Math.random().toString(36))
        .secondSign(Math.random().toString(36))
      break

    case 1: // second signature
      tx = builder
        .secondSignature()
        .create()
        .sign(Math.random().toString(36))
        .secondSign(Math.random().toString(36))
      break

    case 2: // delegate registration
      tx = builder
        .delegate()
        .create(Math.random().toString(36))
        .sign(Math.random().toString(36))
      break

    case 3: // vote registration
      tx = builder
        .vote()
        .create(['+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760'])
        .sign(Math.random().toString(36))
      break

    case 4: // multisignature registration
      const ECkeys = [1, 2, 3].map(() => cryptoBuilder.getKeys(Math.random().toString(36)))

      tx = builder
        .multiSignature()
        .create(ECkeys.map(k => k.Q), 48, 2)
        .sign(Math.random().toString(36))
        .secondSign('')

      const hash = cryptoBuilder.getHash(tx, true, true)
      tx.signatures = ECkeys.slice(1).map(k => k.sign(hash).toDER().toString('hex'))
  }

  tx.recipientId = txData.recipientId
  tx.senderPublicKey = txData.senderPublicKey
  tx.network = 0x17

  return tx
}

const verifyEcdsaNonMalleability = (transaction) => {
  const ecurve = require('ecurve')
  const secp256k1 = ecurve.getCurveByName('secp256k1')
  const n = secp256k1.n
  const hash = cryptoBuilder.getHash(transaction, true, true)

  const signatureBuffer = Buffer.from(transaction.signature, 'hex')
  const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
  const ecpair = ECPair.fromPublicKeyBuffer(senderPublicKeyBuffer, transaction.network)
  const ecsignature = ECSignature.fromDER(signatureBuffer)
  const ecs2 = ECSignature.fromDER(signatureBuffer)
  ecs2.s = n.subtract(ecs2.s)
  const res = ecpair.verify(hash, ecsignature)
  const res2 = ecpair.verify(hash, ecs2)
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

          if (tx.vendorField) {
            tx.vendorFieldHex = Buffer.from(tx.vendorField, 'utf8').toString('hex')
          }

          if (tx.asset.delegate) {
            delete tx.asset.delegate.publicKey
          }

          if (tx.type === 0) {
            delete tx.asset
            tx.expiration = 0
          }

          if (tx.signSignature) {
            tx.secondSignature = tx.signSignature
          }

          if (!tx.recipientId) {
            delete tx.recipientId
          }

          return tx
        })
        .map(tx => {
          const newtx = Transaction.fromBytes(Transaction.serialize(tx).toString('hex'))
          expect(newtx.data).toEqual(tx)
          expect(newtx.verified).toBeTruthy()
        })
      const hex = Transaction.serialize(txData).toString('hex')
      const tx = Transaction.fromBytes(hex)
      expect(tx).toBeInstanceOf(Transaction)
      expect(tx.data).toEqual(txData)
    })
  })

  it('static deserialize', () => {})

  it('serialize', () => {})

  it('Signatures are not malleable', () => {
    [0, 1, 2, 3, 4]
      .map(type => createRandomTx(type))
      .forEach(tx => expect(verifyEcdsaNonMalleability(tx)).toBeTruthy())
  })
})
