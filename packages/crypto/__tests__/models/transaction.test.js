const Transaction = require('../../lib/models/transaction')
const builder = require('../../lib/builder')
const crypto = require('../../lib/crypto/crypto')
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

      // We can't compare the data directly, since the created instance uses Bignums.
      // ... call toBroadcastV1() which casts the Bignums to numbers beforehand.
      expect(transaction.toBroadcastV1()).toEqual(transactionData)
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
    const txs = [{
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
    }, {
      version: 1,
      network: 30,
      type: 1,
      timestamp: 7008644,
      senderPublicKey: '0307919c7cd4e89eeae365251401e3bea10eca9719cdc8ad95698e82e23ab83219',
      fee: 500000000,
      asset:
       { signature:
          { publicKey: '02d2ca222c81907445b9716258fa80aeb9477df588984d83d7de8ba0fe6efdfd92' } },
      signature: '3045022100e7e55c85b7b80bd9a7b419518236978ef3e48d433599f1cf922479724d87616602204f35c0b186797c64bb2cacaf3471263f64696c677f660fb7b25d4c52dfc498d8',
      amount: 0,
      recipientId: 'DQsEkp8eLLPWdATVtW4PHSQYmmxAxn644D',
      id: '249c4d1701221fa2a2b3b1580c385c494e37565baa03059af23b88c6c6c08788'
    }, {
      version: 1,
      network: 30,
      type: 1,
      timestamp: 7448379,
      senderPublicKey: '02d7a20828a121658797d0ece35aa646df8b4dd2de7f97e3d7bd68ff07f055e915',
      fee: 500000000,
      asset:
       { signature:
          { publicKey: '0295cc8522931feaf3ab19396eda5b7041912c0b8ecdbfe63f902adfac11761e61' } },
      signature: '304502210083911412e368456f438708a453b2026e4e3bb4fa34301784ab22ba2561a07cba02203a27160a3048a4774f2c59b919f3b61c3c8c701e4aba425ef43f2c01f1adaf4d',
      amount: 0,
      recipientId: 'DUHGv9GQqLnfcjMikoBk5JN9c9KVgFceFC',
      id: '41322a43ab4d12ec7434e7a0f9b29ebad397f087a341b9967c3f958f42c009ce'
    }, {
      version: 1,
      network: 30,
      type: 1,
      timestamp: 9529109,
      senderPublicKey: '036b56ecfdecbd750ebd34c9948e57170a581cba92f710220de3533a54acbd2585',
      fee: 500000000,
      asset:
       { signature:
          { publicKey: '0380728436880a0a11eadf608c4d4e7f793719e044ee5151074a5f2d5d43cb9066' } },
      signature: '304402201e1e4ae7efb97045ba28efc5f43eced9660f8cbe561465027a9e6ab5a82d97a102207d76d6a2021eed4d2e6e5cb7eeefece01dd5f37a6028ef6f169b89518c4f3de8',
      amount: 0,
      recipientId: 'DGmxh9MQ3dFTmPognHbeRpC82gwFwybzfk',
      id: 'e5f4aa522c746fca5436be2f101e49040b30360bce1031bc66235705584b14dd'
    }]
    txs.forEach(tx =>
      it('txid: ' + tx.id, () => {
        const newtx = new Transaction(tx)
        expect(newtx.id).toEqual(tx.id)
      })
    )
  })

  describe('static serialize', () => {})

  it('Signatures are verified', () => {
    [0, 1, 2, 3, 4]
      .map(type => createRandomTx(type))
      .forEach(transaction => expect(crypto.verify(transaction)).toBeTruthy())
  })
})
