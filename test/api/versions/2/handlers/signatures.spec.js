const utils = require('../utils')
const setupUtils = require('../../../../support/setup-utils')

beforeAll((done) => {
  console.log('before promise')
  setupUtils.ensurePublicAPI().then((data) => {
    console.log('after promise', data)
    done()
  })
}, 60000)

describe('API 2.0 - Signatures', () => {
  describe('GET /api/signatures', () => {
    it('should GET all the signatures', (done) => {
      utils.request('GET', 'signatures').end((err, res) => {
        done()
      })
    })
  })
})
