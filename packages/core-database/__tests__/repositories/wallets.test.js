'use strict'

const _ = require('lodash')
const app = require('../__support__/setup')
const { crypto } = require('@arkecosystem/crypto')

let genesisBlock
let genesisSenders
let repository
let walletManager

beforeAll(async (done) => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../__fixtures__/genesisBlock')
  genesisSenders = _.uniq(_.compact(genesisBlock.transactions.map(tx => tx.senderPublicKey)))

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
  return genesisSenders.map(senderPublicKey => ({
    address: crypto.getAddress(senderPublicKey)
  }))
}

function generateVotes () {
  return genesisSenders.map(senderPublicKey => ({
    address: crypto.getAddress(senderPublicKey),
    vote: genesisBlock.transactions[0].senderPublicKey
  }))
}

function generateFullWallets () {
  return genesisSenders.map(senderPublicKey => {
    const address = crypto.getAddress(senderPublicKey)

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

describe('Wallet Repository', () => {
  it('should be an object', () => {
    expect(repository).toBeObject()
  })

  describe('all', () => {
    it('should be a function', () => {
      expect(repository.all).toBeFunction()
    })

    it('should return the local wallets of the connection', () => {
      repository.connection.walletManager.all = jest.fn()
      repository.all()
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

  describe('findAllByVote', () => {
    const vote = 'dummy-sender-public-key'

    beforeEach(() => {
      const wallets = generateVotes()
      wallets.forEach((wallet, i) => {
        if (i < 17) {
          wallet.vote = vote
        }
      })
      walletManager.index(wallets)
    })

    it('should be a function', () => {
      expect(repository.findAllByVote).toBeFunction()
    })

    it('should be ok without params', () => {
      const { count, rows } = repository.findAllByVote(vote)
      expect(count).toBe(17)
      expect(rows).toHaveLength(17)
    })

    it('should be ok with params', () => {
      const { count, rows } = repository.findAllByVote(vote, { offset: 10, limit: 10 })
      expect(count).toBe(17)
      expect(rows).toHaveLength(7)
    })

    it('should be ok with params (no offset)', () => {
      const { count, rows } = repository.findAllByVote(vote, { limit: 10 })
      expect(count).toBe(17)
      expect(rows).toHaveLength(10)
    })

    it('should be ok with params (offset = 0)', () => {
      const { count, rows } = repository.findAllByVote(vote, { offset: 0, limit: 1 })
      expect(count).toBe(17)
      expect(rows).toHaveLength(1)
    })

    it('should be ok with params (no limit)', () => {
      const { count, rows } = repository.findAllByVote(vote, { offset: 30 })
      expect(count).toBe(17)
      expect(rows).toHaveLength(0)
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

  describe('count', () => {
    it('should be a function', () => {
      expect(repository.count).toBeFunction()
    })

    it('should be ok', () => {
      const wallets = generateWallets()
      walletManager.index(wallets)

      expect(repository.count()).toBe(52)
    })
  })

  describe('top', () => {
    beforeEach(() => {
      walletManager.reindex({ address: 'dummy-1', balance: 1000 })
      walletManager.reindex({ address: 'dummy-2', balance: 2000 })
      walletManager.reindex({ address: 'dummy-3', balance: 3000 })
    })

    it('should be a function', () => {
      expect(repository.top).toBeFunction()
    })

    it('should be ok without params', () => {
      const { count, rows } = repository.top()

      expect(count).toBe(3)
      expect(rows.length).toBe(3)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
      expect(rows[2].balance).toBe(1000)
    })

    it('should be ok with params', () => {
      const { count, rows } = repository.top({ offset: 1, limit: 2 })

      expect(count).toBe(3)
      expect(rows.length).toBe(2)
      expect(rows[0].balance).toBe(2000)
      expect(rows[1].balance).toBe(1000)
    })

    it('should be ok with params (offset = 0)', () => {
      const { count, rows } = repository.top({ offset: 0, limit: 2 })

      expect(count).toBe(3)
      expect(rows.length).toBe(2)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
    })

    it('should be ok with params (no offset)', () => {
      const { count, rows } = repository.top({ limit: 2 })

      expect(count).toBe(3)
      expect(rows.length).toBe(2)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
    })

    it('should be ok with params (no limit)', () => {
      const { count, rows } = repository.top({ offset: 1 })

      expect(count).toBe(3)
      expect(rows.length).toBe(2)
      expect(rows[0].balance).toBe(2000)
      expect(rows[1].balance).toBe(1000)
    })

    it('should be ok with legacy', () => {
      const { count, rows } = repository.top({}, true)

      expect(count).toBe(3)
      expect(rows.length).toBe(3)
      expect(rows[0].balance).toBe(3000)
      expect(rows[1].balance).toBe(2000)
      expect(rows[2].balance).toBe(1000)
    })
  })

  describe('search', async () => {
    const expectSearch = (params, rows = 1, count = 1) => {
      const wallets = repository.search(params)
      expect(wallets).toBeObject()

      expect(wallets).toHaveProperty('count')
      expect(wallets.count).toBeNumber()
      expect(wallets.count).toBe(count)

      expect(wallets).toHaveProperty('rows')
      expect(wallets.rows).toBeArray()
      expect(wallets.rows).not.toBeEmpty()

      expect(wallets.count).toBe(rows)
    }

    it('should be a function', () => {
      expect(repository.search).toBeFunction()
    })

    it('should search wallets by the specified address', () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      expectSearch({ address: wallets[0].address })
    })

    it('should search wallets by the specified publicKey', () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      expectSearch({ publicKey: wallets[0].publicKey })
    })

    it('should search wallets by the specified secondPublicKey', () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      expectSearch({ secondPublicKey: wallets[0].secondPublicKey })
    })

    it('should search wallets by the specified vote', () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      expectSearch({ vote: wallets[0].vote })
    })

    it('should search wallets by the specified username', () => {
      const wallets = generateFullWallets()
      walletManager.index(wallets)

      expectSearch({ username: wallets[0].username })
    })

    it('should search wallets by the specified closed inverval (included) of balance', () => {
      const wallets = generateFullWallets()
      wallets.forEach((wallet, i) => {
        if (i < 13) {
          wallet.balance = 53
        } else if (i < 36) {
          wallet.balance = 99
        }
      })
      walletManager.index(wallets)

      expectSearch({
        balance: {
          from: 53,
          to: 99
        }
      }, 36, 36)
    })

    it('should search wallets by the specified closed interval (included) of voteBalance', () => {
      const wallets = generateFullWallets()
      wallets.forEach((wallet, i) => {
        if (i < 17) {
          wallet.voteBalance = 12
        } else if (i < 29) {
          wallet.voteBalance = 17
        }
      })
      walletManager.index(wallets)

      expectSearch({
        voteBalance: {
          from: 11,
          to: 18
        }
      }, 29, 29)
    })
  })
})
