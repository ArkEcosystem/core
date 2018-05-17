'use strict'

const utils = require('./utils')

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
  return utils.request('POST', 'webhooks', authorization, postData)
}

describe('API 2.0 - Webhooks', () => {
  describe('GET /webhooks', () => {
    it('should GET all the webhooks', async () => {
      const response = await utils.request('GET', 'webhooks', authorization)
      utils.expectSuccessful(response)
      utils.expectCollection(response)
    })
  })

  describe('POST /webhooks', () => {
    it('should POST a new webhook', async () => {
      const response = await createWebhook()
      utils.expectSuccessful(response, 201)
      utils.expectResource(response)
    })
  })

  describe('GET /webhooks/{id}', () => {
    it('should GET a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const response = await utils.request('GET', `webhooks/${webhook.body.data.id}`, authorization)
      utils.expectSuccessful(response)
      utils.expectResource(response)
    })
  })

  describe('PUT /webhooks/{id}', () => {
    it('should PUT a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const response = await utils.request('PUT', `webhooks/${webhook.body.data.id}`, authorization, postData)
      utils.expectSuccessful(response, 204)
    })
  })

  describe('DELETE /webhooks/{id}', () => {
    it('should DELETE a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const response = await utils.request('DELETE', `webhooks/${webhook.body.data.id}`, authorization)
      utils.expectSuccessful(response, 204)
    })
  })

  describe('GET /webhooks/events', () => {
    it('should GET all the webhook events', async () => {
      const response = await utils.request('GET', 'webhooks/events', authorization)
      utils.expectSuccessful(response)
      utils.expectCollection(response)
    })
  })
})
