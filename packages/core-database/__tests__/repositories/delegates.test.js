'use strict'

const app = require('../__support__/setup')
const genesisBlock = require('../__fixtures__/genesisBlock')

const { crypto } = require('@arkecosystem/client')

let repository
let walletManager

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  walletManager = new (require('../../lib/wallet-manager'))()
  repository = new (require('../../lib/repositories/delegates'))({ walletManager })

  done()
})

function generateWallets () {
  return genesisBlock.transactions.map(transaction => {
    const address = crypto.getAddress(transaction.senderPublicKey)

    return {
      address,
      publicKey: `publicKey-${address}`,
      secondPublicKey: `secondPublicKey-${address}`,
      vote: `vote-${address}`,
      username: `username-${address}`,
      balance: 100,
      votebalance: 200
    }
  })
}

describe('Delegate Repository', () => {
  it('should be an object', () => {
    expect(repository).toBeObject()
  })

  describe('findAll', () => {
    it('should be a function', () => {
      expect(repository.findAll).toBeFunction()
    })

    it('should be ok', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const results = repository.findAll()
      expect(results.length).toBe(52)
    })
  })

  describe('paginate', () => {
    it('should be a function', () => {
      expect(repository.paginate).toBeFunction()
    })

    it('should be ok', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const results = repository.paginate({ offset: 10, limit: 10 })
      expect(results.count).toBe(10)
      expect(results.rows).toHaveLength(10)
    })
  })

  describe('search', () => {
    it('should be a function', () => {
      expect(repository.search).toBeFunction()
    })

    it('should be ok', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const results = repository.search({ q: 'username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn' })

      expect(results.count).toBe(1)
      expect(results.rows).toHaveLength(1)
    })
  })

  describe('findById', () => {
    const expectWallet = (key) => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const wallet = repository.findById(wallets[0][key])
      expect(wallet).toBeObject()
      expect(wallet.address).toBe(wallets[0].address)
      expect(wallet.publicKey).toBe(wallets[0].publicKey)
      expect(wallet.username).toBe(wallets[0].username)
    }

    it('should be a function', () => {
      expect(repository.findById).toBeFunction()
    })

    it('should be ok with an address', () => {
      expectWallet('address')
    })

    it('should be ok with a publicKey', () => {
      expectWallet('publicKey')
    })

    it('should be ok with a username', () => {
      expectWallet('username')
    })
  })

  describe('getActiveAtHeight', () => {
    it('should be a function', () => {
      expect(repository.getActiveAtHeight).toBeFunction()
    })

    it('should be ok', async () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      repository.connection.getActiveDelegates = jest.fn(() => {
        return [{
          username: 'test',
          publicKey: 'test',
          balance: 10000 * Math.pow(10, 8),
          producedBlocks: 1000,
          missedBlocks: 500
        }]
      })

      repository.connection.wallets = {}
      repository.connection.wallets.findById = jest.fn(() => {
        return {
          username: 'test',
          balance: 10000 * Math.pow(10, 8),
          producedBlocks: 1000,
          missedBlocks: 500
        }
      })

      const results = await repository.getActiveAtHeight(1)

      expect(results).toBeArray()
      expect(results[0].username).toBeString()
      expect(results[0].approval).toBeNumber()
      expect(results[0].productivity).toBeNumber()
    })
  })
})
