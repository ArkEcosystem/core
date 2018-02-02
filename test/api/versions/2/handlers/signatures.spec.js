const utils = require('../utils')

describe('API 2.0 - Signatures', () => {
  describe('GET /api/signatures', () => {
    it('should GET all the signatures', (done) => {
      utils.request('GET', 'signatures').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })
})
