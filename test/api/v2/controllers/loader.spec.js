const Helpers = require('../helpers')

describe('API 2.0 - Loader', () => {
  describe('GET /api/loader/status', () => {
    it('should GET the loader status', (done) => {
      Helpers.request('GET', 'loader/status').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.loaded).toBeType('boolean')
        expect(res.body.data.now).toBeType('number')
        // expect(res.body.data.blocksCount).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/loader/syncing', () => {
    it('should GET the loader syncing status', (done) => {
      Helpers.request('GET', 'loader/syncing').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.syncing).toBeType('boolean')
        expect(res.body.data.blocks).toBeType('number')
        expect(res.body.data.height).toBeType('number')
        expect(res.body.data.id).toBeType('string')

        done()
      })
    })
  })

  describe('GET /api/loader/configuration', () => {
    it('should GET the loader configuration', (done) => {
      Helpers.request('GET', 'loader/configuration').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.nethash).toBeType('string')
        expect(res.body.data.token).toBeType('string')
        expect(res.body.data.symbol).toBeType('string')
        expect(res.body.data.explorer).toBeType('string')
        expect(res.body.data.version).toBeType('number')

        done()
      })
    })
  })
})
