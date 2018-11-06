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
  axiosMock.onPost(/.*:8080.*/).passThrough()
})

afterEach(async () => {
  axiosMock.reset() // important: resets any existing mocking behavior
})

describe('Blocks', () => {
  describe('POST blocks.latest', () => {
    it('should get the latest block', async () => {
      axiosMock.onGet(/.*\/api\/blocks/).reply(() => [200, { data: [ { id: '123' } ] }, peerMock.headers])

      const response = await request('blocks.latest')

      expect(response.data.result.id).toBeString()
    })
  })

  describe('POST blocks.info', () => {
    it('should get the block information', async () => {
      axiosMock.onGet(/.*\/api\/blocks\/123/).reply(() => [200, { data: { id: '123' } }, peerMock.headers])

      const response = await request('blocks.info', {
        id: '123'
      })

      expect(response.data.result.id).toBe('123')
    })

    it('should fail to get the block information', async () => {
      const response = await request('blocks.info', { id: '123' })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('Block 123 could not be found.')
    })
  })

  describe('POST blocks.transactions', () => {
    it('should get the block transactions', async () => {
      axiosMock.onGet(/.*\/api\/blocks\/123\/transactions/).reply(() => [200, { meta: { totalCount: 1 }, data: [ { id: '123' }, { id: '123' } ] }, peerMock.headers])

      const response = await request('blocks.transactions', {
        id: '123'
      })

      expect(response.data.result.data).toHaveLength(2)
    })

    it('should fail to get the block transactions', async () => {
      const response = await request('blocks.transactions', { id: '123' })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('Block 123 could not be found.')
    })
  })
})
