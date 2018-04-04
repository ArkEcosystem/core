const utils = require('../utils')

const postData = {
  event: 'block.forged',
  target: 'https://httpbin.org/post',
  enabled: true,
  conditions: [{
    key: 'generatorPublicKey',
    condition: 'eq',
    value: 'test-generator'
  }, {
    key: 'fee',
    condition: 'gte',
    value: '123'
  }]
}

const authorization = 'password'

function createWebhook () {
  return utils.request('POST', 'webhooks', postData).set('Authorization', authorization)
}

describe('API 2.0 - Webhooks', () => {
  describe('GET /api/webhooks', () => {
    it('should GET all the webhooks', async () => {
      const res = await utils.request('GET', 'webhooks').set('Authorization', authorization)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
    })
  })

  describe('POST /api/webhooks', () => {
    it('should POST a new webhook', async () => {
      const res = await createWebhook()
      await utils.assertSuccessful(res, 201)
      await utils.assertResource(res)
    })
  })

  describe('GET /api/webhooks/{id}', () => {
    it('should GET a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const res = await utils.request('GET', `webhooks/${webhook.body.data.id}`).set('Authorization', authorization)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)
    })
  })

  describe('PUT /api/webhooks/{id}', () => {
    it('should PUT a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const res = await utils.request('PUT', `webhooks/${webhook.body.data.id}`, postData).set('Authorization', authorization)
      await utils.assertSuccessful(res, 204)
    })
  })

  describe('DELETE /api/webhooks/{id}', () => {
    it('should DELETE a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const res = await utils.request('DELETE', `webhooks/${webhook.body.data.id}`).set('Authorization', authorization)
      await utils.assertSuccessful(res, 204)
    })
  })

  describe('GET /api/webhooks/events', () => {
    it('should GET all the webhook events', async () => {
      const res = await utils.request('GET', 'webhooks/events').set('Authorization', authorization)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
    })
  })
})
