'use strict'

const app = require('../__support__/setup')
const createConnection = require('../__support__/utils/create-connection')
const genesisBlock = require('../__fixtures__/genesisBlock')

let connection
let builder

beforeAll(async (done) => {
  await app.setUp()

  connection = await createConnection()
  builder = new (require('../../lib/builder/wallet'))(connection)

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

const getWallet = (address) => builder.walletManager.getWalletByAddress(address)
const getWalletByPublicKey = (publicKey) => builder.walletManager.getWalletByPublicKey(publicKey)

describe('Wallet Builder', () => {
  it('should be an object', async () => {
    await expect(builder).toBeObject()
  })

  describe('build', async () => {
    it('should be a function', async () => {
      await expect(builder.build).toBeFunction()
    })
  })

  describe('__buildReceivedTransactions', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildReceivedTransactions).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      await expect(getWallet('AeenH7EKK4Fo8Ebotorr9NrVfudukkXhof').balance).toBe(0)

      await builder.__buildReceivedTransactions()

      await expect(getWallet('AeenH7EKK4Fo8Ebotorr9NrVfudukkXhof').balance).toBe(245098000000000)
    })
  })

  describe('__buildBlockRewards', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildBlockRewards).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      builder.__buildBlockRewards = jest.fn(pass => {
        const wallet = builder.walletManager.getWalletByPublicKey(pass)
        wallet.balance += 10
      })

      await expect(getWalletByPublicKey(publicKey).balance).toBe(0)

      await builder.__buildBlockRewards(publicKey)

      await expect(getWalletByPublicKey(publicKey).balance).toBe(10)
    })
  })

  describe('__buildLastForgedBlocks', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildLastForgedBlocks).toBeFunction()
    })

    it('should apply the last forged blocks', async () => {
      await connection.saveBlock(genesisBlock)

      builder.activeDelegates = 51

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      await expect(getWalletByPublicKey(publicKey).lastBlock).toBeNull()

      await builder.__buildLastForgedBlocks()

      await expect(getWalletByPublicKey(publicKey).lastBlock.id).toBe('17184958558311101492')
    })
  })

  describe('__buildSentTransactions', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildSentTransactions).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      await expect(getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn').balance).toBe(0)

      await builder.__buildSentTransactions()

      await expect(getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn').balance).toBe(-12500000000000000)
    })
  })

  describe('__buildSecondSignatures', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildSecondSignatures).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      await expect(getWalletByPublicKey(publicKey).secondPublicKey).toBeNull()

      builder.__buildSecondSignatures = jest.fn(pass => {
        const wallet = builder.walletManager.getWalletByPublicKey(pass)
        wallet.secondPublicKey = 'fake-key'
      })

      await builder.__buildSecondSignatures(publicKey)

      await expect(getWalletByPublicKey(publicKey).secondPublicKey).toBe('fake-key')
    })
  })

  describe('__buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildDelegates).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      await expect(getWallet('AQBo4exLwyapRiDoDteh1fF2ctWWdxofSf').username).toBeNull()

      await builder.__buildDelegates()

      await expect(getWallet('AQBo4exLwyapRiDoDteh1fF2ctWWdxofSf').username).toBe('genesis_43')
    })
  })

  describe('__buildVotes', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildVotes).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      await expect(getWallet('AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD').votes[0]).toBeNull()

      await builder.__buildVotes()

      await expect(getWallet('AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD').votes[0]).toBe('02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a')
    })
  })

  describe('__buildMultisignatures', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildMultisignatures).toBeFunction()
    })

    it('should apply the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const publicKey = '03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068'

      await expect(getWalletByPublicKey(publicKey).multisignature).toBeNull()

      builder.__buildMultisignatures = jest.fn(pass => {
        const wallet = builder.walletManager.getWalletByPublicKey(pass)
        wallet.multisignature = 'fake-multi-signature'
      })

      await builder.__buildMultisignatures(publicKey)

      await expect(getWalletByPublicKey(publicKey).multisignature).toBe('fake-multi-signature')
    })
  })
})
