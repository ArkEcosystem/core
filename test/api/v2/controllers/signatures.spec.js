const Helpers = require('../helpers')

describe('API 2.0 - Signatures', () => {
  describe.skip('GET /api/signatures', () => {
    it('should GET all the signatures', (done) => {
      Helpers.request('GET', 'signatures').end((err, res) => {
        done()
      })
    })
  })
})
