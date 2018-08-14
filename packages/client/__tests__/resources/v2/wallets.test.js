const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v2/wallets')

const configureMocks = require('../../mocks/v2')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(2).resource('wallets')
})

describe('API - 2.0 - Resources - Webhooks', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()

    expect(response.status).toBe(200)
  })

  it('should call "top" method', async () => {
    const response = await resource.top()

    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')

    expect(response.status).toBe(200)
  })

  it('should call "transactions" method', async () => {
    const response = await resource.transactions('123')

    expect(response.status).toBe(200)
  })

  it('should call "transactionsSent" method', async () => {
    const response = await resource.transactionsSent('123')

    expect(response.status).toBe(200)
  })

  it('should call "transactionsReceived" method', async () => {
    const response = await resource.transactionsReceived('123')

    expect(response.status).toBe(200)
  })

  it('should call "votes" method', async () => {
    const response = await resource.votes('123')

    expect(response.status).toBe(200)
  })

  it('should call "search" method', async () => {
    const response = await resource.search({})

    expect(response.status).toBe(200)
  })
})
