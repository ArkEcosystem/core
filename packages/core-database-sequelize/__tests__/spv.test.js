'use strict'

const app = require('./__support__/setup')
const createConnection = require('./__support__/utils/create-connection')
const { Bignum } = require('@arkecosystem/crypto')

let genesisBlock
let connection
let spv

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('./__fixtures__/genesisBlock')
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  connection = await createConnection()
  spv = new (require('../lib/spv'))(connection)
})

afterEach(async () => {
  connection.disconnect()
})

const getWallet = address => {
  return spv.walletManager.findByAddress(address)
}

const findByPublicKey = publicKey => {
  return spv.walletManager.findByPublicKey(publicKey)
}

describe('SPV', () => {
  it('should be an object', () => {
    expect(spv).toBeObject()
  })

  describe('build', () => {
    it('should be a function', () => {
      expect(spv.build).toBeFunction()
    })
  })

  describe('__buildReceivedTransactions', () => {
    it('should be a function', () => {
      expect(spv.__buildReceivedTransactions).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('AeenH7EKK4Fo8Ebotorr9NrVfudukkXhof').balance).toEqual(Bignum.ZERO)

      await spv.__buildReceivedTransactions()

      expect(getWallet('AeenH7EKK4Fo8Ebotorr9NrVfudukkXhof').balance).toEqual(Bignum.from(245098000000000))
    })
  })

  describe('__buildBlockRewards', () => {
    it('should be a function', () => {
      expect(spv.__buildBlockRewards).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      spv.__buildBlockRewards = jest.fn(pass => {
        const wallet = spv.walletManager.findByPublicKey(pass)
        wallet.balance = wallet.balance.add(Bignum.from(10))
      })

      expect(findByPublicKey(publicKey).balance).toEqual(Bignum.ZERO)

      await spv.__buildBlockRewards(publicKey)

      expect(findByPublicKey(publicKey).balance).toEqual(Bignum.from(10))
    })
  })

  describe('__buildLastForgedBlocks', () => {
    it('should be a function', () => {
      expect(spv.__buildLastForgedBlocks).toBeFunction()
    })

    it('should apply the last forged blocks', async () => {
      await connection.saveBlock(genesisBlock)

      spv.activeDelegates = 51

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      expect(findByPublicKey(publicKey).lastBlock).toBeNull()

      await spv.__buildLastForgedBlocks()

      expect(findByPublicKey(publicKey).lastBlock.id).toBe('17184958558311101492')
    })
  })

  describe('__buildSentTransactions', () => {
    it('should be a function', () => {
      expect(spv.__buildSentTransactions).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn').balance).toEqual(Bignum.ZERO)

      await spv.__buildSentTransactions()

      expect(getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn').balance).toEqual(Bignum.from(-12500000000000000))
    })
  })

  describe('__buildSecondSignatures', () => {
    it('should be a function', () => {
      expect(spv.__buildSecondSignatures).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      expect(findByPublicKey(publicKey).secondPublicKey).toBeNull()

      spv.__buildSecondSignatures = jest.fn(pass => {
        const wallet = spv.walletManager.findByPublicKey(pass)
        wallet.secondPublicKey = 'fake-key'
      })

      await spv.__buildSecondSignatures(publicKey)

      expect(findByPublicKey(publicKey).secondPublicKey).toBe('fake-key')
    })
  })

  describe('__buildDelegates', () => {
    it('should be a function', () => {
      expect(spv.__buildDelegates).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('AQBo4exLwyapRiDoDteh1fF2ctWWdxofSf').username).toBeNull()

      await spv.__buildDelegates()

      expect(getWallet('AQBo4exLwyapRiDoDteh1fF2ctWWdxofSf').username).toBe('genesis_43')
    })
  })

  describe('__buildVotes', () => {
    it('should be a function', () => {
      expect(spv.__buildVotes).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD').vote).toBeNull()

      await spv.__buildVotes()

      expect(getWallet('AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD').vote).toBe('02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a')
    })
  })

  describe('__buildMultisignatures', () => {
    it('should be a function', () => {
      expect(spv.__buildMultisignatures).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      expect(findByPublicKey(publicKey).multisignature).toBeNull()

      spv.__buildMultisignatures = jest.fn(pass => {
        const wallet = spv.walletManager.findByPublicKey(pass)
        wallet.multisignature = 'fake-multi-signature'
      })

      await spv.__buildMultisignatures(publicKey)

      expect(findByPublicKey(publicKey).multisignature).toBe('fake-multi-signature')
    })
  })
})
