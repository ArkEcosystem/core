const utils = require('../utils')

describe('API 2.0 - Multi Signatures', () => {
  describe('GET /api/multisignatures', () => {
    it('should GET all the multi signatures', async () => {
      try {
        await utils.request('GET', 'multisignatures')
      } catch (error) {
        expect(error.message).toEqual('Not Implemented')
      }
    })
  })

  describe('GET /api/multisignatures/pending', () => {
    it('should GET all the pending multi signatures', async () => {
      try {
        await utils.request('GET', 'multisignatures/pending')
      } catch (error) {
        expect(error.message).toEqual('Not Implemented')
      }
    })
  })

  describe('GET /api/multisignatures/wallets', () => {
    it('should GET all the wallets that belong to a multi signature', async () => {
      try {
        await utils.request('GET', 'multisignatures/wallets')
      } catch (error) {
        expect(error.message).toEqual('Not Implemented')
      }
    })
  })
})
