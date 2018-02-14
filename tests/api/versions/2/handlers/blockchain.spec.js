const utils = require('../utils')

describe('API 2.0 - Blockchain', () => {
  describe('GET /api/blockchain', () => {
    it('should GET the blockchain constants', async () => {
      const res = await utils.request('GET', 'blockchain')
      await utils.assertSuccessful(res)

      await expect(res.body.data).toBeType('object')
      await expect(res.body.data.height).toBeType('number')
      await expect(res.body.data.reward).toBeType('number')
      await expect(res.body.data.activeDelegates).toBeType('number')
      await expect(res.body.data.blocktime).toBeType('number')

      await expect(res.body.data.block).toBeType('object')
      await expect(res.body.data.block.version).toBeType('number')
      await expect(res.body.data.block.maxTransactions).toBeType('number')
      await expect(res.body.data.block.maxPayload).toBeType('number')

      await expect(res.body.data.epoch).toBeType('string')

      await expect(res.body.data.fees).toBeType('object')
      await expect(res.body.data.fees.send).toBeType('number')
      await expect(res.body.data.fees.vote).toBeType('number')
      await expect(res.body.data.fees.secondsignature).toBeType('number')
      await expect(res.body.data.fees.delegate).toBeType('number')
      await expect(res.body.data.fees.multisignature).toBeType('number')
    })
  })
})
