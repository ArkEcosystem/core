const request = require('./__support__/request')
const { crypto } = require('@arkecosystem/crypto')

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

describe('Accounts', () => {
  describe('POST wallets.info', () => {
    it('should POST wallet with a given address on mainnet', async () => {
      axiosMock
        .onGet(/.*\/api\/wallets\/AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv/)
        .reply(() => [200, { data: { address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv' } }, peerMock.headers])

      const response = await request('wallets.info', {
        address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      await expect(response.data.result.address).toBe('AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv')
    })
  })

  describe('POST wallets.transactions', () => {
    it('should POST last wallet transactions on mainnet', async () => {
      axiosMock
        .onGet(/.*\/api\/transactions/)
        .reply(() => [200, { meta: { totalCount: 2 }, data: [ { id: '123' }, { id: '1234' } ] }, peerMock.headers])

      const response = await request('wallets.transactions', {
        address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      await expect(response.data.result.count).toBe(2)
      await expect(response.data.result.data).toHaveLength(2)
    })
  })

  describe('POST wallets.create.*', () => {
    it('should create an wallet on mainnet', async () => {
      const response = await request('wallets.create', {
        passphrase: 'this is a test'
      })

      await expect(response.data.result.address).toBe('AUdAwTiByRp5BFyGz9uxXuNYa1KGHT4rmt')
      await expect(response.data.result.publicKey).toBe('03675c61dcc23eab75f9948c6510b54d34fced4a73d3c9f2132c76a29750e7a614')
    })

    let bip38wif
    let userId = require('crypto').randomBytes(32).toString('hex')

    it('should create an wallet on mainnet using bip38 encryption', async () => {
      const response = await request('wallets.bip38.create', {
        bip38: 'master password',
        userId
      })

      await expect(response.data.result).toHaveProperty('address')
      await expect(response.data.result).toHaveProperty('publicKey')
      await expect(response.data.result).toHaveProperty('wif')

      bip38wif = response.data.result.wif
    })

    it('should find bip38 backup from userId', async () => {
      const response = await request('wallets.bip38.info', { userId
      })

      await expect(response.data.result).toHaveProperty('wif')
      await expect(response.data.result.wif).toBe(bip38wif)
    })

    it('should create transaction from bip38 backup using userId', async () => {
      const response = await request('transactions.bip38.create', {
        bip38: 'master password',
        userId,
        amount: 1000000000,
        recipientId: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      await expect(response.data.result.recipientId).toBe('AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv')
      await expect(crypto.verify(response.data.result)).toBeTrue()
    })
  })
})
