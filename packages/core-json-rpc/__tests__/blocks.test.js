const request = require('./__support__/request')

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

describe('Blocks', () => {
  describe('GET /mainnet/blocks/latest', () => {
    it('should get the latest block', async () => {
      axiosMock.onGet(/.*\/api\/blocks/).reply(() => [200, { blocks: [ { id: '123' } ] }, peerMock.headers])

      const response = await request('blocks.latest')

      expect(response.data.result.id).toBeString()
    })
  })

  describe('GET /mainnet/blocks/{id}', () => {
    it('should get the block information', async () => {
      axiosMock.onGet(/.*\/api\/blocks\/get/).reply(() => [200, { block: { id: '123' } }, peerMock.headers])

      const response = await request('blocks.info', {
        id: '123'
      })

      expect(response.data.result.id).toBe('123')
    })
  })

  describe('GET /mainnet/blocks/{id}/transactions', () => {
    it('should get the block transactions', async () => {
      axiosMock.onGet(/.*\/api\/transactions/).reply(() => [200, { count: 2, transactions: [ { id: '123' }, { id: '1234' } ] }, peerMock.headers])

      const response = await request('blocks.transactions', {
        id: '123'
      })

      expect(response.data.result.transactions).toHaveLength(2)
    })
  })
})
