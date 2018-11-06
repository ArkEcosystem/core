'use strict'

const app = require('../__support__/setup')
const utils = require('./utils')

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

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

function createWebhook (data = null) {
  return utils.request('POST', 'webhooks', data || postData)
}

describe('API 2.0 - Webhooks', () => {
  describe('GET /webhooks', () => {
    it('should GET all the webhooks', async () => {
      const response = await utils.request('GET', 'webhooks')
      utils.expectSuccessful(response)
      utils.expectCollection(response)
    })
  })

  describe('POST /webhooks', () => {
    it('should POST a new webhook with a simple condition', async () => {
      const response = await createWebhook()
      utils.expectSuccessful(response, 201)
      utils.expectResource(response)
    })

    it('should POST a new webhook with a complex condition', async () => {
      const response = await createWebhook({
        event: 'block.forged',
        target: 'https://httpbin.org/post',
        enabled: true,
        conditions: [{
          key: 'fee',
          condition: 'between',
          value: {
            min: 1,
            max: 2
          }
        }]
      })
      utils.expectSuccessful(response, 201)
      utils.expectResource(response)
    })
  })

  describe('GET /webhooks/{id}', () => {
    it('should GET a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const response = await utils.request('GET', `webhooks/${webhook.data.data.id}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      const { data } = response.data
      const webhookData = Object.assign(webhook.data.data, { token: data.token.substring(0, 32) })
      expect(data).toEqual(webhookData)
    })
  })

  describe('PUT /webhooks/{id}', () => {
    it('should PUT a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const response = await utils.request('PUT', `webhooks/${webhook.data.data.id}`, postData)
      utils.expectStatus(response, 204)
    })
  })

  describe('DELETE /webhooks/{id}', () => {
    it('should DELETE a webhook by the given id', async () => {
      const webhook = await createWebhook()

      const response = await utils.request('DELETE', `webhooks/${webhook.data.data.id}`)
      utils.expectStatus(response, 204)
    })
  })
})
