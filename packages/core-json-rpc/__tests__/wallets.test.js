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

describe('Wallets', () => {
  describe('POST wallets.info', () => {
    it('should get information about the given wallet', async () => {
      axiosMock
        .onGet(/.*\/api\/wallets\/AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv/)
        .reply(() => [200, { data: { address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv' } }, peerMock.headers])

      const response = await request('wallets.info', {
        address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      expect(response.data.result.address).toBe('AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv')
    })

    it('should fail to get information about the given wallet', async () => {
      axiosMock
        .onGet(/.*\/api\/wallets\/AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv/)
        .reply(() => [404, { error: { code: 404, message: 'Wallet AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv could not be found.' } }, peerMock.headers])

      const response = await request('wallets.info', {
        address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('Wallet AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv could not be found.')
    })
  })

  describe('POST wallets.transactions', () => {
    it('should get the transactions for the given wallet', async () => {
      axiosMock
        .onGet(/.*\/api\/transactions/)
        .reply(() => [200, { meta: { totalCount: 2 }, data: [ { id: '123' }, { id: '1234' } ] }, peerMock.headers])

      const response = await request('wallets.transactions', {
        address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      expect(response.data.result.count).toBe(2)
      expect(response.data.result.data).toHaveLength(2)
    })

    it('should fail to get transactions for the given wallet', async () => {
      const response = await request('wallets.transactions', {
        address: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('Wallet AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv could not be found.')
    })
  })

  describe('POST wallets.create', () => {
    it('should create a new wallet', async () => {
      const response = await request('wallets.create', {
        passphrase: 'this is a top secret passphrase'
      })

      expect(response.data.result.address).toBe('AGeYmgbg2LgGxRW2vNNJvQ88PknEJsYizC')
      expect(response.data.result.publicKey).toBe('034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192')
    })
  })

  describe('POST wallets.bip38.*', () => {
    let bip38wif
    let userId = require('crypto').randomBytes(32).toString('hex')

    describe('create', async () => {
      it('should create a new wallet', async () => {
        const response = await request('wallets.bip38.create', {
          bip38: 'this is a top secret passphrase',
          userId
        })

        expect(response.data.result).toHaveProperty('address')
        expect(response.data.result).toHaveProperty('publicKey')
        expect(response.data.result).toHaveProperty('wif')

        bip38wif = response.data.result.wif
      })
    })

    describe('info', async () => {
      it('should find the wallet for the given userId', async () => {
        const response = await request('wallets.bip38.info', { userId })

        expect(response.data.result).toHaveProperty('wif')
        expect(response.data.result.wif).toBe(bip38wif)
      })

      it('should fail to find the wallet for the given userId', async () => {
        const response = await request('wallets.bip38.info', { userId: '123456789' })

        expect(response.data.error.code).toBe(404)
        expect(response.data.error.message).toBe('User 123456789 could not be found.')
      })
    })
  })
})
