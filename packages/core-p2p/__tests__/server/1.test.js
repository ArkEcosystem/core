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

const sendGET = async (endpoint, params = {}) => axios.get(`http://127.0.0.1:4002/${endpoint}`, { params })
const sendPOST = async (endpoint, params) => axios.post(`http://127.0.0.1:4002/${endpoint}`, params)

describe('API - Version 1', () => {
  describe('GET /peer/list', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/list')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /peer/blocks', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /peer/transactionsFromIds', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactionsFromIds')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /peer/height', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/height')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /peer/transactions', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactions')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /peer/blocks/common', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks/common?ids=1,2,3')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe('GET /peer/status', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/status')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe.skip('POST /peer/blocks', async () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/blocks')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })

  describe.skip('POST /peer/transactions', async () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/transactions')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })
})
