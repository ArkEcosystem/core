'use strict'

const axios = require('axios')

const app = require('../__support__/setup')

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

const sendGET = async (endpoint, params = {}) => axios.get(`http://127.0.0.1:4002/internal/${endpoint}`, { params })
const sendPOST = async (endpoint, params) => axios.post(`http://127.0.0.1:4002/internal/${endpoint}`, params)

describe('API - Internal', () => {
  describe('GET /round', async () => {
    it('should be ok', async () => {
      const response = await sendGET('round')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('POST /block', async () => {
    it('should be ok', async () => {
      const response = await sendPOST('block')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('POST /verifyTransaction', async () => {
    it('should be ok', async () => {
      const response = await sendPOST('verifyTransaction')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /forgingTransactions', async () => {
    it('should be ok', async () => {
      const response = await sendGET('forgingTransactions')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })
})
