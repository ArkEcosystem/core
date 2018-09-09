'use strict'

const app = require('../__support__/setup')
const { crypto } = require('@arkecosystem/crypto')

let genesisBlock
let repository
let walletManager
let calculateApproval
let calculateProductivity

beforeAll(async (done) => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../__fixtures__/genesisBlock')

  const delegateCalculator = require('../../lib/repositories/utils/delegate-calculator')
  calculateApproval = delegateCalculator.calculateApproval
  calculateProductivity = delegateCalculator.calculateProductivity

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
      voteBalance: 200
    }
  })
}

describe('Delegate Repository', () => {
  it('should be an object', () => {
    expect(repository).toBeObject()
  })

  describe('getLocalDelegates', () => {
    const delegates = [
      { username: 'delegate-0' },
      { username: 'delegate-1' },
      { username: 'delegate-2' }
    ]
    const wallets = [
      delegates[0],
      {},
      delegates[1],
      { username: '' },
      delegates[2],
      {}
    ]

    it('should be a function', () => {
      expect(repository.getLocalDelegates).toBeFunction()
    })

    it('should return the local wallets of the connection that are delegates', () => {
      repository.connection.walletManager.all = jest.fn(() => wallets)

      expect(repository.getLocalDelegates()).toEqual(expect.arrayContaining(delegates))
      expect(repository.connection.walletManager.all).toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should be a function', () => {
      expect(repository.findAll).toBeFunction()
    })

    it('should be ok without params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.findAll()
      expect(count).toBe(52)
      expect(rows).toHaveLength(52)
    })

    it('should be ok with params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.findAll({ offset: 10, limit: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (no offset)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.findAll({ limit: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (offset = 0)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.findAll({ offset: 0, limit: 12 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(12)
    })

    it('should be ok with params (no limit)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.findAll({ offset: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(42)
    })
  })

  describe('paginate', () => {
    it('should be a function', () => {
      expect(repository.paginate).toBeFunction()
    })

    it('should be ok without params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.paginate()
      expect(count).toBe(52)
      expect(rows).toHaveLength(52)
    })

    it('should be ok with params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.paginate({ offset: 10, limit: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (no offset)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.paginate({ limit: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (offset = 0)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.paginate({ offset: 0, limit: 12 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(12)
    })

    it('should be ok with params (no limit)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.paginate({ offset: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(42)
    })
  })

  describe('search', () => {
    it('should be a function', () => {
      expect(repository.search).toBeFunction()
    })

    it('should search by exact username match', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.search({ username: 'username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn' })

      expect(count).toBe(1)
      expect(rows).toHaveLength(1)
    })

    it('should search that username contains the string', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.search({ username: 'username' })

      expect(count).toBe(52)
      expect(rows).toHaveLength(52)
    })

    describe('when no results', () => {
      it('should be ok', () => {
        const { count, rows } = repository.search({ username: 'unknown-dummy-username' })

        expect(count).toBe(0)
        expect(rows).toHaveLength(0)
      })
    })

    it('should be ok with params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.search({ username: 'username', offset: 10, limit: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (no offset)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.search({ username: 'username', limit: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (offset = 0)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.search({ username: 'username', offset: 0, limit: 12 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(12)
    })

    it('should be ok with params (no limit)', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const { count, rows } = repository.search({ username: 'username', offset: 10 })
      expect(count).toBe(52)
      expect(rows).toHaveLength(42)
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

    it('should be ok', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const delegate = {
        username: 'test',
        publicKey: 'test',
        balance: 10000 * Math.pow(10, 8),
        producedBlocks: 1000,
        missedBlocks: 500
      }
      const height = 1

      repository.connection.getActiveDelegates = jest.fn(() => [delegate])
      repository.connection.wallets = {
        findById: jest.fn(() => delegate)
      }

      const results = repository.getActiveAtHeight(height)

      expect(results).toBeArray()
      expect(results[0].username).toBeString()
      expect(results[0].approval).toBeString() // '0.18'
      expect(results[0].productivity).toBeString() // '98.97'
      expect(results[0].approval).toBe(calculateApproval(delegate, height))
      expect(results[0].productivity).toBe(calculateProductivity(delegate))
    })
  })
})
