const Helpers = require('../helpers')

describe('API 2.0 - Multi Signatures', () => {
  describe.skip('GET /api/multisignatures', () => {
    it('should GET all the multi signatures', (done) => {
      Helpers.request('GET', 'multisignatures').end((err, res) => {
        done()
      })
    })
  })

  describe.skip('GET /api/multisignatures/pending', () => {
    it('should GET all the pending multi signatures', (done) => {
      Helpers.request('GET', 'multisignatures/pending').end((err, res) => {
        done()
      })
    })
  })

  describe.skip('GET /api/multisignatures/wallets', () => {
    it('should GET all the wallets that belong to a multi signature', (done) => {
      Helpers.request('GET', 'multisignatures/wallets').end((err, res) => {
        done()
      })
    })
  })
})
