const Helpers = require('../helpers')

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
const voteBalance = 0
const voteBalanceFrom = -1
const voteBalanceTo = 1

describe('API 2.0 - Wallets', () => {
  describe('GET /api/wallets', () => {
    it('should GET all the wallets', (done) => {
      Helpers.request('GET', 'wallets').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        Helpers.assertWallet(res.body.data[1])

        done()
      })
    })
  })

  describe('GET /api/wallets/top', () => {
    it('should GET all the top wallets', (done) => {
      Helpers.request('GET', 'wallets/top').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        Helpers.assertWallet(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/wallets/:id', () => {
    it('should GET a wallet by the given identifier', (done) => {
      Helpers.request('GET', `wallets/${addressActive}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        const wallet = res.body.data
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should return ResourceNotFound error', (done) => {
      Helpers.request('GET', `wallets/${addressCold}`).end((err, res) => {
        Helpers.assertError(err, res)

        expect(res.body).toHaveProperty('code', 'ResourceNotFound')

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/transactions', () => {
    it('should GET all the transactions for the given wallet by id', (done) => {
      Helpers.request('GET', `wallets/${addressActive}/transactions`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        Helpers.assertTransaction(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/transactions/send', () => {
    it('should GET all the send transactions for the given wallet by id', (done) => {
      Helpers.request('GET', `wallets/${addressActive}/transactions/send`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.sender).toBe(addressActive)

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/transactions/received', () => {
    it('should GET all the received transactions for the given wallet by id', (done) => {
      Helpers.request('GET', `wallets/${addressActive}/transactions/received`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        Helpers.assertTransaction(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/wallets/:id/votes', () => {
    it('should GET all the votes for the given wallet by id', (done) => {
      Helpers.request('GET', `wallets/${addressActive}/votes`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

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

  describe('POST /api/wallets/search', () => {
    it('should POST a search for wallets with the exact specified address', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should POST a search for wallets with the exact specified publicKey', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, publicKey }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)
        expect(wallet.public_key).toBe(publicKey)

        done()
      })
    })

    it('should POST a search for wallets with the exact specified secondPublicKey', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressSecondPassphrase, secondPublicKey }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressSecondPassphrase)

        done()
      })
    })

    it('should POST a search for wallets with the exact specified vote', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, vote }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should POST a search for wallets with the exact specified username', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, username }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it.skip('should POST a search for wallets with the exact specified balance', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, balance }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)
        expect(wallet.balance).toBe(balance)

        done()
      })
    })

    it.skip('should POST a search for wallets with the specified balance range', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, balance: { from: balanceFrom, to: balanceTo } }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)
        expect(wallet.balance).toBe(balance)

        done()
      })
    })

    it('should POST a search for wallets with the exact specified votebalance', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, votebalance: voteBalance }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should POST a search for wallets with the specified votebalance range', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, votebalance: { from: voteBalanceFrom, to: voteBalanceTo } }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })

    it('should POST a search for wallets with the wrong specified username', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive, username: wrongUsername }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(0)

        done()
      })
    })

    it('should POST a search for wallets with the specific criteria', (done) => {
      Helpers.request('POST', 'wallets/search', {
        publicKey,
        username,
        balance: {
          from: balanceFrom,
          to: balanceTo,
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const wallet = res.body.data[0]
        Helpers.assertWallet(wallet)
        expect(wallet.address).toBe(addressActive)

        done()
      })
    })
  })
})
