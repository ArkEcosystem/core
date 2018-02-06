const utils = require('../utils')

describe('API 2.0 - Multi Signatures', () => {
  describe('GET /api/multisignatures', () => {
    it('should GET all the multi signatures', (done) => {
      utils.request('GET', 'multisignatures').end((err, res) => {
        done()
      })
    })
  })

  describe('GET /api/multisignatures/pending', () => {
    it('should GET all the pending multi signatures', (done) => {
      utils.request('GET', 'multisignatures/pending').end((err, res) => {
        done()
      })
    })
  })

  describe('GET /api/multisignatures/wallets', () => {
    it('should GET all the wallets that belong to a multi signature', (done) => {
      utils.request('GET', 'multisignatures/wallets').end((err, res) => {
        done()
      })
    })
  })
})
