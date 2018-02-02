const utils = require('../utils')
const setupUtils = require('../../../../support/setup-utils')

beforeAll((done) => {
  console.log('before promise')
  setupUtils.ensurePublicAPI().then((data) => {
    console.log('after promise', data)
    done()
  })
}, 60000)

describe('API 1.0 - Signatures', () => {
  describe('GET /api/signatures/fee', () => {
    it('should return second signature value from config', (done) => {
      utils.request('GET', 'signatures/fee').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.fee).toBeType('number')

        done()
      })
    })
  })
})
