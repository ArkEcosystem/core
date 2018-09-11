const { Buffer } = require('buffer/')
const ecurve = require('ecurve')

const ECPair = require('../../lib/crypto/ecpair')
const ecdsa = require('../../lib/crypto/ecdsa')
const crypto = require('../../lib/crypto/crypto')
const configManager = require('../../lib/managers/config')
const { TRANSACTION_TYPES, CONFIGURATIONS } = require('../../lib/constants')

beforeEach(() => configManager.setConfig(CONFIGURATIONS.ARK.DEVNET))

describe('crypto.js', () => {
  describe('getBytes', () => {
    let bytes = null

    it('should be a function', () => {
      expect(crypto.getBytes).toBeFunction()
    })

    // it('should return Buffer of simply transaction and buffer must be 292 length', () => {
    //   const transaction = {
    //     type: 0,
    //     amount: 1000,
    //     fee: 2000,
    //     recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
    //     timestamp: 141738,
    //     asset: {},
    //     senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
    //     signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a' // eslint-disable-line max-len
    //   }

    //   bytes = crypto.getBytes(transaction)
    //   expect(bytes).toBeObject()
    //   expect(bytes.toString('hex') + transaction.signature).toHaveLength(292)
    // })

    it('should return Buffer of simply transaction and buffer must be 202 length', () => {
      const transaction = {
        type: 0,
        amount: 1000,
        fee: 2000,
        recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        timestamp: 141738,
        asset: {},
        senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a', // eslint-disable-line max-len
        id: '13987348420913138422'
      }

      bytes = crypto.getBytes(transaction)
      expect(bytes).toBeObject()
      expect(bytes.length).toBe(202)
      expect(bytes.toString('hex')).toBe('00aa2902005d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09171dfc69b54c7fe901e91d5a9ab78388645e2427ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e803000000000000d007000000000000618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a')
    })

    // it('should return Buffer of transaction with second signature and buffer must be 420 length', () => {
    //   const transaction = {
    //     type: 0,
    //     amount: 1000,
    //     fee: 2000,
    //     recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
    //     timestamp: 141738,
    //     asset: {},
    //     senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
    //     signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a', // eslint-disable-line max-len
    //     signSignature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a' // eslint-disable-line max-len
    //   }

    //   bytes = crypto.getBytes(transaction)
    //   expect(bytes).toBeObject()
    //   expect(bytes.toString('hex') + transaction.signature + transaction.signSignature).toHaveLength(420)
    // })

    it('should return Buffer of transaction with second signature and buffer must be 266 length', () => {
      const transaction = {
        version: 1,
        type: 0,
        amount: 1000,
        fee: 2000,
        recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        timestamp: 141738,
        asset: {},
        senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a', // eslint-disable-line max-len
        signSignature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a', // eslint-disable-line max-len
        id: '13987348420913138422'
      }

      bytes = crypto.getBytes(transaction)
      expect(bytes).toBeObject()
      expect(bytes.length).toBe(266)
      expect(bytes.toString('hex')).toBe('00aa2902005d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09171dfc69b54c7fe901e91d5a9ab78388645e2427ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e803000000000000d007000000000000618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a');
    })
  })

  describe('getHash', () => {
    it('should be a function', () => {
      expect(crypto.getHash).toBeFunction()
    })

    it('should return Buffer and Buffer most be 32 bytes length', () => {
      const transaction = {
        version: 1,
        type: 0,
        amount: 1000,
        fee: 2000,
        recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        timestamp: 141738,
        asset: {},
        senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a' // eslint-disable-line max-len
      }

      const result = crypto.getHash(transaction)
      expect(result).toBeObject()
      expect(result).toHaveLength(32)
      expect(result.toString('hex')).toBe('952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea')
    })
  })

  describe('getId', () => {
    it('should be a function', () => {
      expect(crypto.getId).toBeFunction()
    })

    xit('should return string id and be equal to 952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea', () => {
      const transaction = {
        type: 0,
        amount: 1000,
        fee: 2000,
        recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        timestamp: 141738,
        asset: {},
        senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
        signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a' // eslint-disable-line max-len
      }

      const id = crypto.getId(transaction) // old id
      expect(id).toBeString()
      expect(id).toBe('952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea')
    })
  })

  describe('getFee', () => {
    it('should be a function', () => {
      expect(crypto.getFee).toBeFunction()
    })

    it('should return 10000000', () => {
      const fee = crypto.getFee({ type: TRANSACTION_TYPES.TRANSFER })
      expect(fee).toBeNumber()
      expect(fee).toBe(10000000)
    })
  })

  describe('sign', () => {
    it('should be a function', () => {
      expect(crypto.sign).toBeFunction()
    })

    it('should return a valid signature', () => {
      const keys = crypto.getKeys('secret')
      const transaction = {
        type: 0,
        amount: 1000,
        fee: 2000,
        recipientId: 'AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff',
        timestamp: 141738,
        asset: {},
        senderPublicKey: keys.getPublicKeyBuffer().toString('hex')
      }
      const signature = crypto.sign(transaction, keys)
      expect(signature.toString('hex')).toBe('3045022100f5c4ec7b3f9a2cb2e785166c7ae185abbff0aa741cbdfe322cf03b914002efee02206261cd419ea9074b5d4a007f1e2fffe17a38338358f2ac5fcc65d810dbe773fe')
    })
  })

  describe('secondSign', () => {
    it('should be a function', () => {
      expect(crypto.secondSign).toBeFunction()
    })
  })

  describe('getKeys', () => {
    it('should be a function', () => {
      expect(crypto.getKeys).toBeFunction()
    })

    it('should return two keys in hex', () => {
      const keys = crypto.getKeys('secret')

      expect(keys).toBeObject()
      expect(keys).toHaveProperty('publicKey')
      expect(keys).toHaveProperty('privateKey')

      expect(keys.publicKey).toBeString()
      expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, 'hex').toString('hex'))

      expect(keys.privateKey).toBeString()
      expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, 'hex').toString('hex'))
    })
  })

  describe('getAddress', () => {
    it('should be a function', () => {
      expect(crypto.getAddress).toBeFunction()
    })

    it('should generate address by publicKey', () => {
      const keys = crypto.getKeys('secret')
      const address = crypto.getAddress(keys.publicKey)

      expect(address).toBeString()
      expect(address).toBe('D7seWn8JLVwX4nHd9hh2Lf7gvZNiRJ7qLk')
    })

    it('should generate address by publicKey - second test', () => {
      const keys = crypto.getKeys('secret second test to be sure it works correctly')
      const address = crypto.getAddress(keys.publicKey)

      expect(address).toBeString()
      expect(address).toBe('DDp4SYpnuzFPuN4W79PYY762d7FtW3DFFN')
    })

    it('should generate the same address as ECPair.getAddress()', () => {
      const keys = crypto.getKeys('secret second test to be sure it works correctly')
      const address = crypto.getAddress(keys.publicKey)

      const Q = ecurve.Point.decodeFrom(ecdsa.__curve, Buffer.from(keys.publicKey, 'hex'))
      const keyPair = new ECPair(null, Q)

      expect(address).toBe(keyPair.getAddress())
    })

    it('should not throw an error if the publicKey is valid', () => {
      try {
        const validKeys = ['02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af', 'a'.repeat(66)]
        for (const validKey of validKeys) {
          crypto.getAddress(validKey)
        }
      } catch (error) {
        expect().fail('Should not have failed to call getAddress with a valid publicKey')
      }
    })

    it('should throw an error if the publicKey is invalid', () => {
      const invalidKeys = ['invalid', 'a'.repeat(65), 'a'.repeat(67), 'z'.repeat(66)]
      for (const invalidKey of invalidKeys) {
        expect(() => crypto.getAddress(invalidKey)).toThrowError(new Error(`publicKey '${invalidKey}' is invalid`))
      }
    })
  })

  describe('verify', () => {
    it('should be a function', () => {
      expect(crypto.verify).toBeFunction()
    })
  })

  describe('verifySecondSignature', () => {
    it('should be a function', () => {
      expect(crypto.verifySecondSignature).toBeFunction()
    })
  })

  describe('validate address on different networks', () => {
    it('should validate MAINNET addresses', () => {
      configManager.setConfig(CONFIGURATIONS.ARK.MAINNET)

      expect(crypto.validateAddress('AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX')).toBeTruthy()
    })

    it('should validate DEVNET addresses', () => {
      configManager.setConfig(CONFIGURATIONS.ARK.DEVNET)

      expect(crypto.validateAddress('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN')).toBeTruthy()
    })
  })
})
