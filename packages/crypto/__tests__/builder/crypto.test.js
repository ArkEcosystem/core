const { Buffer } = require('buffer/')
const ecurve = require('ecurve')

const ECPair = require('../../lib/crypto/ecpair')
const ecdsa = require('../../lib/crypto/ecdsa')
const cryptoBuilder = require('../../lib/builder/crypto')
const configManager = require('../../lib/managers/config')
const { TRANSACTION_TYPES, CONFIGURATIONS } = require('../../lib/constants')

beforeEach(() => configManager.setConfig(CONFIGURATIONS.ARK.DEVNET))

describe('cryptoBuilder.js', () => {
  describe('getBytes', () => {
    let bytes = null

    it('should be a function', () => {
      expect(cryptoBuilder.getBytes).toBeFunction()
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

    //   bytes = cryptoBuilder.getBytes(transaction)
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

      bytes = cryptoBuilder.getBytes(transaction)
      expect(bytes).toBeObject()
      expect(bytes.length).toBe(202)
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

    //   bytes = cryptoBuilder.getBytes(transaction)
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

      bytes = cryptoBuilder.getBytes(transaction)
      expect(bytes).toBeObject()
      expect(bytes.length).toBe(266)
    })
  })

  describe('getHash', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.getHash).toBeFunction()
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

      const result = cryptoBuilder.getHash(transaction)
      expect(result).toBeObject()
      expect(result).toHaveLength(32)
    })
  })

  describe('getId', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.getId).toBeFunction()
    })

    xit('should return string id and be equal to 619fd7971db6f317fdee3675c862291c976d072a0a1782410e3a6f5309022491', () => {
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

      const id = cryptoBuilder.getId(transaction) // old id
      expect(id).toBeString()
      expect(id).toBe('952e33b66c35a3805015657c008e73a0dee1efefd9af8c41adb59fe79745ccea')
    })
  })

  describe('getFee', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.getFee).toBeFunction()
    })

    it('should return 10000000', () => {
      const fee = cryptoBuilder.getFee({ type: TRANSACTION_TYPES.TRANSFER })
      expect(fee).toBeNumber()
      expect(fee).toBe(10000000)
    })
  })

  describe('sign', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.sign).toBeFunction()
    })
  })

  describe('secondSign', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.secondSign).toBeFunction()
    })
  })

  describe('getKeys', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.getKeys).toBeFunction()
    })

    it('should return two keys in hex', () => {
      const keys = cryptoBuilder.getKeys('secret')

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
      expect(cryptoBuilder.getAddress).toBeFunction()
    })

    it('should generate address by publicKey', () => {
      const keys = cryptoBuilder.getKeys('secret')
      const address = cryptoBuilder.getAddress(keys.publicKey)

      expect(address).toBeString()
      expect(address).toBe('D7seWn8JLVwX4nHd9hh2Lf7gvZNiRJ7qLk')
    })

    it('should generate address by publicKey - second test', () => {
      const keys = cryptoBuilder.getKeys('secret second test to be sure it works correctly')
      const address = cryptoBuilder.getAddress(keys.publicKey)

      expect(address).toBeString()
      expect(address).toBe('DDp4SYpnuzFPuN4W79PYY762d7FtW3DFFN')
    })

    it('should generate the same address as ECPair.getAddress()', () => {
      const keys = cryptoBuilder.getKeys('secret second test to be sure it works correctly')
      const address = cryptoBuilder.getAddress(keys.publicKey)

      const Q = ecurve.Point.decodeFrom(ecdsa.__curve, Buffer.from(keys.publicKey, 'hex'))
      const keyPair = new ECPair(null, Q)

      expect(address).toBe(keyPair.getAddress())
    })
  })

  describe('verify', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.verify).toBeFunction()
    })
  })

  describe('verifySecondSignature', () => {
    it('should be a function', () => {
      expect(cryptoBuilder.verifySecondSignature).toBeFunction()
    })
  })

  describe('validate address on different networks', () => {
    it('should validate MAINNET addresses', () => {
      configManager.setConfig(CONFIGURATIONS.ARK.MAINNET)

      expect(cryptoBuilder.validateAddress('AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX')).toBeTruthy()
    })

    it('should validate DEVNET addresses', () => {
      configManager.setConfig(CONFIGURATIONS.ARK.DEVNET)

      expect(cryptoBuilder.validateAddress('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN')).toBeTruthy()
    })
  })
})
