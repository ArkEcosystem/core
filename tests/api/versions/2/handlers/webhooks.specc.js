const utils = require('../utils')

describe.skip('API 2.0 - Webhooks', () => {
  describe('GET /api/webhooks', () => {
    it('should GET all the webhooks', async () => {
      const res = await utils.request('GET', 'webhooks')
      await utils.assertSuccessful(res)
    })
  })

  describe('POST /api/webhooks', () => {
    it('should POST a new webhook', async () => {
      const res = await utils.request('POST', 'webhooks')
      await utils.assertSuccessful(res, 201)
    })
  })

  describe('GET /api/webhooks/{id}', () => {
    it('should GET a webhook by the given id', async () => {
      const res = await utils.request('GET', 'webhooks/{id}')
      await utils.assertSuccessful(res)
    })
  })

  describe('PUT /api/webhooks/{id}', () => {
    it('should PUT a webhook by the given id', async () => {
      const res = await utils.request('PUT', 'webhooks/{id}')
      await utils.assertSuccessful(res)
    })
  })

  describe('DELETE /api/webhooks/{id}', () => {
    it('should DELETE a webhook by the given id', async () => {
      const res = await utils.request('DELETE', 'webhooks/{id}')
      await utils.assertSuccessful(res, 204)
    })
  })

  describe('GET /api/webhooks/events', () => {
    it('should GET all the webhook events', async () => {
      const res = await utils.request('GET', 'webhooks/events')
      await utils.assertSuccessful(res)
    })
  })
})
