'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const app = require('../../__support__/setup')
const utils = require('../utils')

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

describe.skip('API 2.0 - Statistics', () => {
  describe('GET /statistics/blockchain', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET the blockchain statistics', async () => {
        const response = await utils[request]('GET', 'statistics/blockchain')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data.supply).toBeObject()
        expect(response.data.data.supply.initial).toBeNumber()
        expect(response.data.data.supply.current).toBeNumber()

        expect(response.data.data.blocks).toBeObject()
        expect(response.data.data.blocks.forged).toBeNumber()
        expect(response.data.data.blocks.rewards).toBeNumber()

        expect(response.data.data.rewards).toBeObject()
        expect(response.data.data.rewards.start).toBeNumber()
        expect(response.data.data.rewards.total).toBeNumber()

        expect(response.data.data.productivity).toBeObject()
        expect(response.data.data.productivity.best.username).toBeString()
        expect(response.data.data.productivity.best.productivity).toBeString()

        expect(response.data.data.productivity.worst).toBeObject()
        expect(response.data.data.productivity.worst.username).toBeString()
        expect(response.data.data.productivity.worst.productivity).toBeString()
      })
    })
  })

  // TODO: big performance impact, think about storing them in memory on boot
  describe('GET /statistics/transactions', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET the transaction statistics', async () => {
        const response = await utils[request]('GET', 'statistics/transactions')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data.count).toBeNumber()
        expect(response.data.data.amount).toBeNumber()
        expect(response.data.data.fees).toBeNumber()
      })
    })
  })

  // TODO: big performance impact, think about storing them in memory on boot
  describe('GET /statistics/blocks', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET the block statistics', async () => {
        const response = await utils[request]('GET', 'statistics/blocks')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data.count).toBeNumber()
        expect(response.data.data.rewards).toBeNumber()
        expect(response.data.data.fees).toBeNumber()
      })
    })
  })

  describe('GET /statistics/votes', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET the vote statistics', async () => {
        const response = await utils[request]('GET', 'statistics/votes')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data.count).toBeNumber()
        expect(response.data.data.amount).toBeNumber()
        expect(response.data.data.fees).toBeNumber()
      })
    })
  })

  describe('GET /statistics/unvotes', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET the unvote statistics', async () => {
        const response = await utils[request]('GET', 'statistics/unvotes')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data.count).toBeNumber()
        expect(response.data.data.amount).toBeNumber()
        expect(response.data.data.fees).toBeNumber()
      })
    })
  })
})
