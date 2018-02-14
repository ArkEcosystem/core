const utils = require('../utils')

describe('API 2.0 - Signatures', () => {
  describe('GET /api/signatures', () => {
    it('should GET all the signatures', async () => {
      const res = await utils.request('GET', 'signatures')
    })
  })
})
