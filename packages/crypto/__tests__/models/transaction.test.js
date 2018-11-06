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
    it('should verify all transactions', () => {
      [0, 1, 2, 3, 4].map(type => createRandomTx(type)).map(transaction => {
        const ser = Transaction.serialize(transaction.data).toString('hex')
        const newTransaction = Transaction.fromBytes(ser)
        expect(newTransaction.data).toEqual(transaction.data)
        expect(newTransaction.verified).toBeTrue()
      })
    })

    it('should create a transaction', () => {
      const hex = Transaction.serialize(transactionData).toString('hex')
      const transaction = Transaction.fromBytes(hex)
      expect(transaction).toBeInstanceOf(Transaction)

      // We can't compare the data directly, since the created instance uses Bignums.
      // ... call toJson() which casts the Bignums to numbers beforehand.
      expect(transaction.toJson()).toEqual(transactionData)
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
      id: '89f354918b36197269b0e5514f8da66f19829a024f664ccc124bfaabe0266e10',
      version: 1,
      timestamp: 48068690,
      senderPublicKey: '03b7d1da5c1b9f8efd0737d47123eb9cf7eb6d58198ef31bb6f01aa04bc4dda19d',
      recipientId: 'DHPNjqCaTR9KYtC8nHh7Zt1G86Xj4YiU2V',
      type: 1,
      amount: '0',
      fee: '500000000',
      signature: '3045022100e8e03bdac70e18f220feacba25c1575aa89d1ab61673e54eb2aff38439666d2702207e2d84290d7ef2571f5b2fab7e22a77dec96b1c4187cf9def15be74db98e2700',
      asset: {
        signature: {
          publicKey: '03b7d1da5c1b9f8efd0737d47123eb9cf7eb6d58198ef31bb6f01aa04bc4dda19d'
        }
      }
    }, {
      id: 'a50af2bb1f043d128480346d0b49f5b3165716d5c630c6b0978dc7aa168e77a8',
      version: 1,
      timestamp: 48068923,
      senderPublicKey: '03173fd793c4bac0d64e9bd74ec5c2055716a7c0266feec9d6d94cb75be097b75d',
      recipientId: 'DQrj9eh9otRgz2jWdu1K1ASBQqZA6dTkra',
      type: 1,
      amount: '0',
      fee: '500000000',
      signature: '3045022100b263d28a5da58b17c874a5666afab0657f8492266554ad8ff722b00d41e1493d02200c2156dd9b9c1739f1c2099e98b763952bc7ef0423ad9786dcd32f7ffaf4aafc',
      asset: {
        signature: {
          publicKey: '03173fd793c4bac0d64e9bd74ec5c2055716a7c0266feec9d6d94cb75be097b75d'
        }
      }
    }, {
      id: '68e34dc1c417cbfb47e5deea142974bc24c8d03df206f168c8b23d6a4decff73',
      version: 1,
      timestamp: 48068956,
      senderPublicKey: '02813ade967f05384e0567841d175294b4102c06c428011646e5ef989212925fcf',
      recipientId: 'D8PGSYLUC3CxYaXoKjMA2gjV4RaeBpwghZ',
      type: 1,
      amount: '0',
      fee: '500000000',
      signature: '3045022100e593eb501e89941461e247606d088b6e226cc5b5224f89cede532d35f9b16250022034bbdd098493639221e808301e0a99c3790ef9c6d357ac10266c518a2a66066f',
      asset: {
        signature: {
          publicKey: '02813ade967f05384e0567841d175294b4102c06c428011646e5ef989212925fcf'
        }
      }
    }, {
      id: 'b4b3433be888b4b95b68b83a84a08e40d748b0ad92acf8487072ef01c1de251a',
      version: 1,
      timestamp: 48069792,
      senderPublicKey: '03f9f9dafc06faf4a54be2e45cd7a5523e41f38bb439f6f93cf00a0990e7afc116',
      recipientId: 'DNuwcwYGTHDdhTPWMTYekhuGM1fFUpW9Jj',
      type: 1,
      amount: '0',
      fee: '500000000',
      signature: '3044022052d1e5be426a79f827a67597fd460237de65e035593144e4e3afb0e82ab40f3802201d6e31892d000e73532bf8659851a3d221205d65ed1c0b8d08ce46b72c7f00ae',
      asset: {
        signature: {
          publicKey: '03f9f9dafc06faf4a54be2e45cd7a5523e41f38bb439f6f93cf00a0990e7afc116'
        }
      }
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
      .forEach(transaction => expect(crypto.verify(transaction)).toBeTrue())
  })
})
