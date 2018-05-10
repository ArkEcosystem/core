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

describe('API - Remote', () => {
  describe('GET /blockchain/{event}', async () => {
    it('should be ok', async () => {
      const response = await sendGET('blockchain/event')

      await expect(response.status).toBe(200)
      await expect(response.data).toBeObject()
    })
  })
})
