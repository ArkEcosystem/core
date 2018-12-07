import 'jest-extended'
import '@arkecosystem/core-test-utils/lib/matchers'
import { setUp, tearDown } from "../../__support__/setup";
import utils from '../utils'

const peers = require('@arkecosystem/core-test-utils/config/testnet/peers.json')


beforeAll(async () => {
  await setUp()
})

afterAll(async () => {
  await tearDown()
})

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET all the peers', async () => {
        const response = await utils[request]('GET', 'peers')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data[0]).toBeObject()
      })
    })
  })

  describe('GET /peers/:ip', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET a peer by the given ip', async () => {
        const response = await utils[request](
          'GET',
          `peers/${peers.list[0].ip}`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data).toBeObject()
      })
    })
  })
})
