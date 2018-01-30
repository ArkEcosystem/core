const Helpers = require('../helpers')

const addressActive = 'DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN'
const addressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'

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
        wallet.address.should.equal(addressActive)

        done()
      })
    })

    it('should return ResourceNotFound error', (done) => {
      Helpers.request('GET', `wallets/${addressCold}`).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('code').which.is.a('string').eq('ResourceNotFound')

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
        transaction.sender.should.equal(addressActive)

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
        vote.should.have.property('id').which.is.a('string')
        vote.should.have.property('type').which.is.a('number')
        vote.should.have.property('amount').which.is.a('number')
        vote.should.have.property('fee').which.is.a('number')
        vote.should.have.property('sender').which.is.a('string').and.equals(addressActive)
        vote.should.have.property('recipient').which.is.a('string')
        vote.should.have.property('signature').which.is.a('string')
        vote.should.have.property('asset').which.is.an('object')
        vote.asset.should.have.property('votes').which.is.an('array')

        done()
      })
    })
  })

  describe('POST /api/wallets/search', () => {
    it('should POST a search for wallets with the specified criteria', (done) => {
      Helpers.request('POST', 'wallets/search', { address: addressActive }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const wallet = res.body.data[0]
        wallet.should.have.property('address').which.is.a('string').and.equals(addressActive)
        wallet.should.have.property('public_key').which.is.a('string')
        wallet.should.have.property('balance').which.is.a('number')
        wallet.should.have.property('is_delegate').which.is.a('boolean')

        done()
      })
    })
  })
})
