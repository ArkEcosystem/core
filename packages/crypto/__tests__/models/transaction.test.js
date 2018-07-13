const Transaction = require('../../lib/models/transaction')
const builder = require('../../lib/builder')
const crypto = require('../../lib/crypto/crypto')
const ECPair = require('../../lib/crypto/ecpair')
const ECSignature = require('../../lib/crypto/ecsignature')
const transactionData = require('./fixtures/transaction')

const configManager = require('../../lib/managers/config')
const network = require('../../lib/networks/ark/devnet.json')

const createRandomTx = type => {
  let transaction

  switch (type) {
    case 0: // transfer
      transaction = builder
        .transfer()
        .recipientId('AMw3TiLrmVmwmFVwRzn96kkUsUpFTqsAEX')
        .amount(1000 * Math.pow(10, 10))
        .vendorField(Math.random().toString(36))
        .sign(Math.random().toString(36))
        .secondSign(Math.random().toString(36))
        .build()
      break

    case 1: // second signature
      transaction = builder
        .secondSignature()
        .signatureAsset(Math.random().toString(36))
        .sign(Math.random().toString(36))
        .build()
      break

    case 2: // delegate registration
      transaction = builder
        .delegateRegistration()
        .usernameAsset('dummy-delegate')
        .sign(Math.random().toString(36))
        .build()
      break

    case 3: // vote registration
      transaction = builder
        .vote()
        .votesAsset(['+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760'])
        .sign(Math.random().toString(36))
        .build()
      break

    case 4: // multisignature registration
      const passphrases = [1, 2, 3].map(() => Math.random().toString(36))
      const publicKeys = passphrases.map(passphrase => '+' + crypto.getKeys(passphrase).publicKey)
      const min = Math.min(1, publicKeys.length)
      const max = Math.max(1, publicKeys.length)
      const minSignatures = Math.floor(Math.random() * (max - min)) + min

      const transactionBuilder = builder
        .multiSignature()
        .multiSignatureAsset({
          keysgroup: publicKeys,
          min: minSignatures,
          lifetime: Math.floor(Math.random() * (72 - 1)) + 1
        })
        .sign(Math.random().toString(36))

      for (let i = 0; i < minSignatures; i++) {
        transactionBuilder.multiSignatureSign(passphrases[i])
      }

      transaction = transactionBuilder.build()
  }

  return transaction
}

const verifyEcdsaNonMalleability = (transaction) => {
  const ecurve = require('ecurve')
  const secp256k1 = ecurve.getCurveByName('secp256k1')
  const n = secp256k1.n
  const hash = crypto.getHash(transaction, true, true)

  const signatureBuffer = Buffer.from(transaction.signature, 'hex')
  const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
  const ecpair = ECPair.fromPublicKeyBuffer(senderPublicKeyBuffer, transaction.network)
  const ecsignature = ECSignature.fromDER(signatureBuffer)
  const ecs2 = ECSignature.fromDER(signatureBuffer)
  ecs2.s = n.subtract(ecs2.s)
  const result1 = ecpair.verify(hash, ecsignature)
  const result2 = ecpair.verify(hash, ecs2)
  return result1 === true && result2 === false
}

describe('Models - Transaction', () => {
  beforeEach(() => configManager.setConfig(network))

  describe('static fromBytes', () => {
    it('returns a new transaction', () => {
      [0, 1, 2, 3, 4].map(type => createRandomTx(type))
        .map(transaction => {
          transaction.version = 1

          if (transaction.vendorField) {
            transaction.vendorFieldHex = Buffer.from(transaction.vendorField, 'utf8').toString('hex')
            transaction.data.vendorField = transaction.vendorField
          }

          if (transaction.asset && transaction.asset.delegate) {
            delete transaction.asset.delegate.publicKey
          }

          if (transaction.type === 0) {
            delete transaction.asset
            transaction.expiration = 0
            transaction.data.expiration = 0
          }

          if (transaction.signSignature) {
            transaction.secondSignature = transaction.signSignature
          }

          if (!transaction.recipientId) {
            delete transaction.recipientId
          }

          return transaction
        })
        .map(transaction => {
          const newTransaction = Transaction.fromBytes(Transaction.serialize(transaction).toString('hex'))
          expect(newTransaction.data).toEqual(transaction.data)
          expect(newTransaction.verified).toBeTruthy()
        })
      const hex = Transaction.serialize(transactionData).toString('hex')
      const transaction = Transaction.fromBytes(hex)
      expect(transaction).toBeInstanceOf(Transaction)
      expect(transaction.data).toEqual(transactionData)
    })
  })

  describe('static deserialize', () => {
    it('should match transaction id', () => {
      [0, 1, 2, 3, 4].map(type => createRandomTx(type))
        .map(transaction => {
          const originalId = transaction.id
          const newTransaction = Transaction.deserialize(Transaction.serialize(transaction).toString('hex'))
          expect(newTransaction.id).toEqual(originalId)
        })
    })
  })

  describe('static serialize', () => {})

  it('Signatures are not malleable', () => {
    [0, 1, 2, 3, 4]
      .map(type => createRandomTx(type))
      .forEach(transaction => expect(verifyEcdsaNonMalleability(transaction)).toBeTruthy())
  })
})
