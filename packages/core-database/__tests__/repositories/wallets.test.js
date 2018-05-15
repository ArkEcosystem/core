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
  repository = new (require('../../lib/repositories/wallets'))({ walletManager })

  done()
})

function generateWallets () {
  return genesisBlock.transactions.map(transaction => ({
    address: crypto.getAddress(transaction.senderPublicKey)
  }))
}

function generateVotes () {
  return genesisBlock.transactions.map(transaction => ({
    address: crypto.getAddress(transaction.senderPublicKey),
    vote: transaction.senderPublicKey
  }))
}

function generateFullWallets () {
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

describe('Wallet Repository', () => {
  it('should be an object', async () => {
    await expect(repository).toBeObject()
  })

  describe('findAll', () => {
    it('should be a function', () => {
      expect(repository.findAll).toBeFunction()
    })

    it('should be ok without params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const results = repository.findAll()
      expect(results.length).toBe(52)
    })

    it('should be ok with params', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      const results = repository.findAll({ offset: 10, limit: 10 })
      expect(results.count).toBe(10)
      expect(results.rows).toHaveLength(10)
    })
  })

  describe('findAllByVote', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByVote).toBeFunction()
    })

    it('should be ok without params', () => {
      const wallets = generateVotes()
      walletManager.index(wallets)

      const results = repository.findAllByVote(wallets[0].vote)
      expect(results.length).toBe(1)
    })

    it('should be ok with params', () => {
      const wallets = generateVotes()
      walletManager.index(wallets)

      const results = repository.findAllByVote(wallets[0].vote, { offset: 0, limit: 1 })
      expect(results.count).toBe(1)
      expect(results.rows).toHaveLength(1)
    })
  })

  describe('findById', async () => {
    const expectWallet = (key) => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      const wallet = repository.findById(wallets[0][key])
      expect(wallet).toBeObject()
      expect(wallet.address).toBe(wallets[0].address)
      expect(wallet.publicKey).toBe(wallets[0].publicKey)
      expect(wallet.username).toBe(wallets[0].username)
    }

    it('should be a function', async () => {
      await expect(repository.findById).toBeFunction()
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

  describe('count', async () => {
    it('should be a function', async () => {
      await expect(repository.count).toBeFunction()
    })

    it('should be ok', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      expect(repository.count()).toBe(52)
    })
  })

  describe('top', async () => {
    beforeEach(() => {
      walletManager.reindex({ address: 'dummy-1', balance: 1000 })
      walletManager.reindex({ address: 'dummy-2', balance: 2000 })
      walletManager.reindex({ address: 'dummy-3', balance: 3000 })
    })

    it('should be a function', async () => {
      await expect(repository.top).toBeFunction()
    })

    it('should be ok without params', () => {
      const { count, rows } = repository.top()

      expect(count).toBe(3)
      expect(count).toBe(rows.length)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
      expect(rows[2].balance).toBe(1000)
    })

    it('should be ok with params', () => {
      const { count, rows } = repository.top({ offset: 1, limit: 2 })

      expect(count).toBe(2)
      expect(count).toBe(rows.length)
      expect(rows[0].balance).toBe(2000)
      expect(rows[1].balance).toBe(1000)
    })

    it('should be ok with params (no offset)', () => {
      const { count, rows } = repository.top({ offset: 0, limit: 2 })

      expect(count).toBe(2)
      expect(count).toBe(rows.length)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
    })

    it('should be ok with legacy', () => {
      const { count, rows } = repository.top({}, true)

      expect(count).toBe(3)
      expect(count).toBe(rows.length)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
      expect(rows[2].balance).toBe(1000)
    })
  })

  describe('search', async () => {
    const expectSearch = (params, expected = 1) => {
      const wallets = repository.search(params)
      expect(wallets).toBeObject()

      expect(wallets).toHaveProperty('count')
      expect(wallets.count).toBeNumber()

      expect(wallets).toHaveProperty('rows')
      expect(wallets.rows).toBeArray()
      expect(wallets.rows).not.toBeEmpty()

      expect(wallets.count).toBe(expected)
    }

    it('should be a function', async () => {
      await expect(repository.search).toBeFunction()
    })

    it('should search wallets by the specified address', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({ address: wallets[0].address })
    })

    it('should search wallets by the specified publicKey', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({ publicKey: wallets[0].publicKey })
    })

    it('should search wallets by the specified secondPublicKey', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({ secondPublicKey: wallets[0].secondPublicKey })
    })

    it('should search wallets by the specified vote', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({ vote: wallets[0].vote })
    })

    it('should search wallets by the specified username', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({ username: wallets[0].username })
    })

    it('should search wallets by the specified balance', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({
        balance: {
          from: generateFullWallets()[0].balance,
          to: generateFullWallets()[0].balance
        }
      }, 52)
    })

    it('should search wallets by the specified votebalance', async () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      await expectSearch({
        votebalance: {
          from: generateFullWallets()[0].votebalance,
          to: generateFullWallets()[0].votebalance
        }
      }, 52)
    })
  })
})
