'use strict'

const app = require('../__support__/setup')
const utils = require('../__support__/utils')

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

describe('API - Internal', () => {
  describe('GET /rounds/current', () => {
    it('should be ok', async () => {
      const response = await utils.GET('internal/rounds/current')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('POST /blocks', () => {
    it('should be ok', async () => {
      const response = await utils.POST('internal/blocks', {
        block: genesisBlock.toBroadcastV1()
      })

      expect(response.status).toBe(204)
    })
  })

  describe.skip('POST /transactions/verify', () => {
    it('should be ok', async () => {
      const response = await utils.POST('internal/transactions/verify', {
        transaction: genesisTransaction
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /transactions/forging', () => {
    it('should be ok', async () => {
      const response = await utils.GET('internal/transactions/forging')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /network/state', () => {
    it('should be ok', async () => {
      const response = await utils.GET('internal/network/state')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })
})
