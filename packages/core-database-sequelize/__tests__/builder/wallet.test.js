'use strict'

const app = require('../__support__/setup')
const createConnection = require('../__support__/utils/create-connection')
const genesisBlock = require('../__fixtures__/genesisBlock')

let connection
let builder

beforeAll(async (done) => {
  await app.setUp()

  connection = await createConnection()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  connection.disconnect()

  connection = await createConnection()
  builder = new (require('../../lib/builder/wallet'))(connection)

  done()
})

const getWallet = address => {
  return builder.walletManager.getWalletByAddress(address)
}

const getWalletByPublicKey = publicKey => {
  return builder.walletManager.getWalletByPublicKey(publicKey)
}

describe('Wallet Builder', () => {
  it('should be an object', () => {
    expect(builder).toBeObject()
  })

  describe('build', () => {
    it('should be a function', () => {
      expect(builder.build).toBeFunction()
    })
  })

  describe('__buildReceivedTransactions', () => {
    it('should be a function', () => {
      expect(builder.__buildReceivedTransactions).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('AeenH7EKK4Fo8Ebotorr9NrVfudukkXhof').balance).toBe(0)

      await builder.__buildReceivedTransactions()

      expect(getWallet('AeenH7EKK4Fo8Ebotorr9NrVfudukkXhof').balance).toBe(245098000000000)
    })
  })

  describe('__buildBlockRewards', () => {
    it('should be a function', () => {
      expect(builder.__buildBlockRewards).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      builder.__buildBlockRewards = jest.fn(pass => {
        const wallet = builder.walletManager.getWalletByPublicKey(pass)
        wallet.balance += 10
      })

      expect(getWalletByPublicKey(publicKey).balance).toBe(0)

      await builder.__buildBlockRewards(publicKey)

      expect(getWalletByPublicKey(publicKey).balance).toBe(10)
    })
  })

  describe('__buildLastForgedBlocks', () => {
    it('should be a function', () => {
      expect(builder.__buildLastForgedBlocks).toBeFunction()
    })

    it('should apply the last forged blocks', async () => {
      await connection.saveBlock(genesisBlock)

      builder.activeDelegates = 51

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      expect(getWalletByPublicKey(publicKey).lastBlock).toBeNull()

      await builder.__buildLastForgedBlocks()

      expect(getWalletByPublicKey(publicKey).lastBlock.id).toBe('17184958558311101492')
    })
  })

  describe('__buildSentTransactions', () => {
    it('should be a function', () => {
      expect(builder.__buildSentTransactions).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn').balance).toBe(0)

      await builder.__buildSentTransactions()

      expect(getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn').balance).toBe(-12500000000000000)
    })
  })

  describe('__buildSecondSignatures', () => {
    it('should be a function', () => {
      expect(builder.__buildSecondSignatures).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      expect(getWalletByPublicKey(publicKey).secondPublicKey).toBeNull()

      builder.__buildSecondSignatures = jest.fn(pass => {
        const wallet = builder.walletManager.getWalletByPublicKey(pass)
        wallet.secondPublicKey = 'fake-key'
      })

      await builder.__buildSecondSignatures(publicKey)

      expect(getWalletByPublicKey(publicKey).secondPublicKey).toBe('fake-key')
    })
  })

  describe('__buildDelegates', () => {
    it('should be a function', () => {
      expect(builder.__buildDelegates).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('AQBo4exLwyapRiDoDteh1fF2ctWWdxofSf').username).toBeNull()

      await builder.__buildDelegates()

      expect(getWallet('AQBo4exLwyapRiDoDteh1fF2ctWWdxofSf').username).toBe('genesis_43')
    })
  })

  describe('__buildVotes', () => {
    it('should be a function', () => {
      expect(builder.__buildVotes).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      expect(getWallet('AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD').vote).toBeNull()

      await builder.__buildVotes()

      expect(getWallet('AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD').vote).toBe('02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a')
    })
  })

  describe('__buildMultisignatures', () => {
    it('should be a function', () => {
      expect(builder.__buildMultisignatures).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      expect(getWalletByPublicKey(publicKey).multisignature).toBeNull()

      builder.__buildMultisignatures = jest.fn(pass => {
        const wallet = builder.walletManager.getWalletByPublicKey(pass)
        wallet.multisignature = 'fake-multi-signature'
      })

      await builder.__buildMultisignatures(publicKey)

      expect(getWalletByPublicKey(publicKey).multisignature).toBe('fake-multi-signature')
    })
  })
})
