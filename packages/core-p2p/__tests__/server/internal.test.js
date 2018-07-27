'use strict'

const axios = require('axios')

const app = require('../__support__/setup')

let genesisBlock
let genesisTransaction

beforeAll(async () => {
  await app.setUp()

  // Wait for the setup to complete before creating the Genesis Block or else it uses a potentially
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
  describe('GET /round', () => {
    it('should be ok', async () => {
      const response = await sendGET('round')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })

  describe('POST /block', () => {
    it('should be ok', async () => {
      const response = await sendPOST('block', genesisBlock.toBroadcastV1())

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })

  describe.skip('POST /verifyTransaction', () => {
    it('should be ok', async () => {
      const response = await sendPOST('verifyTransaction', {
        transaction: genesisTransaction
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })

  describe('GET /forgingTransactions', () => {
    it('should be ok', async () => {
      const response = await sendGET('forgingTransactions')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })

  describe('GET /networkState', () => {
    it('should be ok', async () => {
      const response = await sendGET('networkState')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })
})
