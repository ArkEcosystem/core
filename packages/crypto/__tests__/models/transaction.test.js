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
          const ser = Transaction.serialize(transaction.data).toString('hex')
          const newTransaction = Transaction.fromBytes(ser)
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
          const originalId = transaction.data.id
          const newTransaction = new Transaction(transaction.data)
          expect(newTransaction.id).toEqual(originalId)
        })
    })
  })

  describe('should deserialize correctly some tests transactions', () => {
    const tx = {
      id: '80d75c7b90288246199e4a97ba726bad6639595ef92ad7c2bd14fd31563241ab',
      network: 0x17,
      height: 918991,
      type: 1,
      timestamp: 7410965,
      amount: 0,
      fee: 500000000,
      recipientId: 'AP4UQ6j9hAHsxudpXh47RNQi7oF1AEfkAG',
      senderPublicKey: '03ca269b2942104b2ad601ccfbe7bd30b14b99cb55210ef7c1a5e25b6669646b99',
      signature: '3045022100d01e0cf0813a722ab5ad92aece2d4d1c3a537422e2ea769182f9172417224e890220437e407db51c4c47393db2e5b1258b2e3ecb707738a5ffdc6e96f08aee7e9c74',
      asset: {
        signature: {
          publicKey: '03c0e7e86dadd316275a31d84a1fdccd00cd26cc059982f95a1b24382c6ec2ceb0'
        }
      }
    }
    it('mainnet-txid: ' + tx.id, () => {
      const newtx = new Transaction(tx)
      expect(newtx.id).toEqual(tx.id)
    })
  })

  describe('static serialize', () => {})

  it('Signatures are not malleable', () => {
    [0, 1, 2, 3, 4]
      .map(type => createRandomTx(type))
      .forEach(transaction => expect(verifyEcdsaNonMalleability(transaction)).toBeTruthy())
  })
})
