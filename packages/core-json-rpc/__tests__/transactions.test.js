const request = require('./__support__/request')
const ark = require('@arkecosystem/crypto')
const app = require('./__support__/setup')

const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const axiosMock = new MockAdapter(axios)

jest.mock('is-reachable', () => {
  return jest.fn(async (peer) => {
    return true
  })
})

let peerMock

beforeAll(async () => {
  await app.setUp()

  const Peer = require('@arkecosystem/core-p2p/lib/peer')
  peerMock = new Peer('0.0.0.99', 4002)
  Object.assign(peerMock, peerMock.headers, { status: 'OK' })

  const monitor = require('@arkecosystem/core-container').resolvePlugin('p2p')
  monitor.peers = {}
  monitor.peers[peerMock.ip] = peerMock
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  axiosMock.onGet(/.*\/api\/loader\/autoconfigure/).reply(() => [200, { network: {} }, peerMock.headers])
  axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 5 }, peerMock.headers])
  axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { success: true, peers: [ { status: 'OK', ip: peerMock.ip, port: 4002, height: 5, delay: 8 } ] }, peerMock.headers])
  axiosMock.onPost(/.*:8080.*/).passThrough()
})

afterEach(async () => {
  axiosMock.reset() // important: resets any existing mocking behavior
})

describe('Transactions', () => {
  describe('POST /mainnet/transactions', () => {
    let transaction

    it('should create tx on mainnet and tx should verify', async () => {
      const response = await request('transactions.create', {
        amount: 100000000,
        recipientId: 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn',
        passphrase: 'This is a test'
      })

      expect(response.data.result.recipientId).toBe('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn')
      expect(ark.crypto.verify(response.data.result)).toBeTrue()

      transaction = response.data.result
    })

    it('should broadcast tx on mainnet using the old method', async () => {
      axiosMock.onPost(/.*\/peer\/transactions/).reply(() => [200, { success: true }, peerMock.headers])

      const response = await request('transactions.broadcast', {
        transactions: [transaction]
      })

      expect(ark.crypto.verify(response.data.result[0])).toBeTrue()
    })

    it('should broadcast tx on mainnet using the new method', async () => {
      axiosMock.onPost(/.*\/peer\/transactions/).reply(() => [200, { success: true }, peerMock.headers])

      const response = await request('transactions.broadcast', { id: transaction.id })

      expect(ark.crypto.verify(response.data.result)).toBeTrue()
    })
  })
})
