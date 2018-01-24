const Helpers = require('../helpers')

describe('API 2.0 - Loader', () => {
  describe('GET /api/loader/status', () => {
    it('should GET the loader status', (done) => {
      Helpers.request('GET', 'loader/status').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('loaded').which.is.a('boolean')
        res.body.data.should.have.property('now').which.is.a('number')
        res.body.data.should.have.property('blocksCount').which.is.null // mount p2p for .a('number')

        done()
      })
    })
  })

  describe('GET /api/loader/syncing', () => {
    it('should GET the loader syncing status', (done) => {
      Helpers.request('GET', 'loader/syncing').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('syncing').which.is.a('boolean')
        res.body.data.should.have.property('blocks').which.is.null // mount p2p for .a('number')
        res.body.data.should.have.property('height').which.is.a('number')
        res.body.data.should.have.property('id').which.is.a('string')

        done()
      })
    })
  })

  describe('GET /api/loader/configuration', () => {
    it('should GET the loader configuration', (done) => {
      Helpers.request('GET', 'loader/configuration').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('nethash').which.is.a('string')
        res.body.data.should.have.property('token').which.is.a('string')
        res.body.data.should.have.property('symbol').which.is.a('string')
        res.body.data.should.have.property('explorer').which.is.a('string')
        res.body.data.should.have.property('version').which.is.a('number')

        done()
      })
    })
  })
})
