'use strict'

const axios = require('axios')

const app = require('../__support__/setup')

let genesisBlock
let genesisTransaction

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../__fixtures__/genesisBlock')
  genesisTransaction = require('../__fixtures__/genesisTransaction')
})

afterAll(async () => {
  await app.tearDown()
})

const sendGET = async (endpoint, params = {}) => {
  return axios.get(`http://127.0.0.1:4002/internal/${endpoint}`, { params })
}

const sendPOST = async (endpoint, params) => {
  return axios.post(`http://127.0.0.1:4002/internal/${endpoint}`, params)
}

describe('API - Internal', () => {
  describe('GET /rounds/current', () => {
    it('should be ok', async () => {
      const response = await sendGET('rounds/current')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('POST /blocks', () => {
    it('should be ok', async () => {
      const response = await sendPOST('blocks', {
        block: genesisBlock.toBroadcastV1()
      })

      expect(response.status).toBe(204)
    })
  })

  describe.skip('POST /transactions/verify', () => {
    it('should be ok', async () => {
      const response = await sendPOST('transactions/verify', {
        transaction: genesisTransaction
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /transactions/forging', () => {
    it('should be ok', async () => {
      const response = await sendGET('transactions/forging')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /network/state', () => {
    it('should be ok', async () => {
      const response = await sendGET('network/state')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })
})
