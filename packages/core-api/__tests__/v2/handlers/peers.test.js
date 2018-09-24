'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const app = require('../../__support__/setup')
const utils = require('../utils')

const peers = require('@arkecosystem/core-test-utils/config/testnet/peers.json')

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    it('should GET all the peers', async () => {
      const response = await utils.request('GET', 'peers')
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data[0]).toBeObject()
    })
  })

  describe('GET /peers/:ip', () => {
    it('should GET a peer by the given ip', async () => {
      const response = await utils.request('GET', `peers/${peers.list[0].ip}`)
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeObject()

      expect(response.data.data).toBeObject()
    })
  })
})
