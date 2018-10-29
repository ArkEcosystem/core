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
  axiosMock.onPost(/.*:8080.*/).passThrough()
})

afterEach(async () => {
  axiosMock.reset() // important: resets any existing mocking behavior
})

describe('Transactions', () => {
  describe('POST transactions.info', () => {
    it('should get the transaction for the given ID', async () => {
      axiosMock
        .onGet(/.*\/api\/transactions/)
        .reply(() => [200, { data: { id: 'e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8' } }, peerMock.headers])

      const response = await request('transactions.info', {
        id: 'e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8'
      })

      expect(response.data.result.id).toBe('e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8')
    })

    it('should fail to get the transaction for the given ID', async () => {
      const response = await request('transactions.info', {
        id: 'e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8'
      })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.')
    })
  })

  describe('POST transactions.create', () => {
    it('should create a new transaction and verify', async () => {
      const response = await request('transactions.create', {
        amount: 100000000,
        recipientId: 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn',
        passphrase: 'this is a top secret passphrase'
      })

      expect(response.data.result.recipientId).toBe('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn')
      expect(crypto.verify(response.data.result)).toBeTrue()
    })
  })

  describe('POST transactions.broadcast', () => {
    it('should broadcast the transaction', async () => {
      const transaction = await request('transactions.create', {
        amount: 100000000,
        recipientId: 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn',
        passphrase: 'this is a top secret passphrase'
      })

      axiosMock.onPost(/.*\/api\/transactions/).reply(() => [200, { success: true }, peerMock.headers])

      const response = await request('transactions.broadcast', { id: transaction.data.result.id })

      expect(crypto.verify(response.data.result)).toBeTrue()
    })

    it('should fail to broadcast the transaction', async () => {
      const response = await request('transactions.broadcast', {
        id: 'e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8'
      })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.')
    })
  })

  describe('POST transactions.bip38.create', () => {
    it('should create a new transaction', async () => {
      const userId = require('crypto').randomBytes(32).toString('hex')
      await request('wallets.bip38.create', {
        bip38: 'this is a top secret passphrase', userId
      })

      const response = await request('transactions.bip38.create', {
        bip38: 'this is a top secret passphrase',
        userId,
        amount: 1000000000,
        recipientId: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      expect(response.data.result.recipientId).toBe('AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv')
      expect(crypto.verify(response.data.result)).toBeTrue()
    })

    it('should fail to create a new transaction', async () => {
      const response = await request('transactions.bip38.create', {
        bip38: 'this is a top secret passphrase',
        userId: '123456789',
        amount: 1000000000,
        recipientId: 'AUDud8tvyVZa67p3QY7XPRUTjRGnWQQ9Xv'
      })

      expect(response.data.error.code).toBe(404)
      expect(response.data.error.message).toBe('User 123456789 could not be found.')
    })
  })
})
