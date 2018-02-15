const utils = require('../utils')

describe('API 2.0 - Signatures', () => {
  describe('GET /api/signatures', () => {
    it('should GET all the signatures', async () => {
      try {
        await utils.request('GET', 'signatures')
      } catch (error) {
        expect(error.message).toEqual('Not Implemented')
      }
    })
  })
})
