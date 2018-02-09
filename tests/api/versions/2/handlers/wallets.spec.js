const utils = require('../utils')

const addressActive = 'DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN'
const addressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'
const addressSecondPassphrase = 'DR23FuR1M9GPaknEFSP6QCbsaHnTMdgkFu'
const publicKey = '022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d'
const secondPublicKey = '027c0dc4da12a3842981d37240a4da48eea435299191609d5f446176ff18024df6'
const vote = '0257b7724e97cd832e0c28533a86da5220656f9b5122141daab20e8526decce01f'
const username = 'boldninja'
const wrongUsername = 'alexbarnsley'
const balance = 9970340000000
const balanceFrom = 8947070000000
const balanceTo = 10947070000000
const votebalance = 0
const votebalanceFrom = -1
const votebalanceTo = 1

describe('API 2.0 - Wallets', () => {
  describe('GET /api/wallets', () => {
    it('should GET all the wallets', (done) => {
      utils.request('GET', 'wallets').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        utils.assertWallet(res.body.data[1])

        done()
      })
    })
  })

  describe('GET /api/wallets/top', () => {
    it('should GET all the top wallets', (done) => {
      utils.request('GET', 'wallets/top').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        utils.assertWallet(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/wallets/:id', () => {
    it('should GET a wallet by the given identifier', (done) => {
      utils.request('GET', `wallets/${addressActive}`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        const wallet = res.body.data
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should return ResourceNotFound error', (done) => {
      utils.request('GET', `wallets/${addressCold}`).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body).toHaveProperty('error', 'Not Found')

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/transactions', () => {
    it('should GET all the transactions for the given wallet by id', (done) => {
      utils.request('GET', `wallets/${addressActive}/transactions`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        utils.assertTransaction(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/transactions/send', () => {
    it('should GET all the send transactions for the given wallet by id', (done) => {
      utils.request('GET', `wallets/${addressActive}/transactions/send`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        const transaction = res.body.data[0]
        utils.assertTransaction(transaction)
        expect(transaction.sender).toBe(addressActive)

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/transactions/received', () => {
    it('should GET all the received transactions for the given wallet by id', (done) => {
      utils.request('GET', `wallets/${addressActive}/transactions/received`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        utils.assertTransaction(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/votes', () => {
    it('should GET all the votes for the given wallet by id', (done) => {
      utils.request('GET', `wallets/${addressActive}/votes`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        const vote = res.body.data[0]
        expect(vote.id).toBeType('string')
        expect(vote.type).toBeType('number')
        expect(vote.amount).toBeType('number')
        expect(vote.fee).toBeType('number')
        expect(vote.sender).toBe(addressActive)
        expect(vote.recipient).toBeType('string')
        expect(vote.signature).toBeType('string')
        expect(vote.asset).toBeType('object')
        expect(vote.asset.votes).toBeType('array')

        done()
      })
    })
  })

  describe('GET /api/wallets/search', () => {
    it('should GET a search for wallets with the exact specified address', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should GET a search for wallets with the exact specified publicKey', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, publicKey }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)
        expect(wallet.publicKey).toBe(publicKey)

        done()
      })
    })

    it('should GET a search for wallets with the exact specified secondPublicKey', (done) => {
      utils.request('GET', 'wallets/search', { address: addressSecondPassphrase, secondPublicKey }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressSecondPassphrase)

        done()
      })
    })

    it('should GET a search for wallets with the exact specified vote', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, vote }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should GET a search for wallets with the exact specified username', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, username }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it.skip('should GET a search for wallets with the exact specified balance', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, balance }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)
        expect(wallet.balance).toBe(balance)

        done()
      })
    })

    it.skip('should GET a search for wallets with the specified balance range', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, balanceFrom, balanceTo }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)
        expect(wallet.balance).toBe(balance)

        done()
      })
    })

    it.skip('should GET a search for wallets with the exact specified votebalance', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, votebalance }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should GET a search for wallets with the specified votebalance range', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, votebalanceFrom, votebalanceTo }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should GET a search for wallets with the wrong specified username', (done) => {
      utils.request('GET', 'wallets/search', { address: addressActive, username: wrongUsername }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(0)

        done()
      })
    })

    it('should GET a search for wallets with the specific criteria', (done) => {
      utils.request('GET', 'wallets/search', {
        publicKey,
        username,
        balanceFrom,
        balanceTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        utils.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })
  })
})
