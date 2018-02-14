const utils = require('../utils')

describe('API 1.0 - Signatures', () => {
  describe('GET /api/signatures/fee', () => {
    it('should return second signature value from config', async () => {
      const res = await utils.request('GET', 'signatures/fee')
      await utils.assertSuccessful(res)

      await expect(res.body.fee).toBeType('number')
    })
  })
})
