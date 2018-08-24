const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v1/accounts')

const configureMocks = require('../../mocks/v1')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(1).resource('accounts')
})

describe('API - 1.0 - Resources - Accounts', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all({})

    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')

    expect(response.status).toBe(200)
  })

  it('should call "count" method', async () => {
    const response = await resource.count()

    expect(response.status).toBe(200)
  })

  it('should call "delegates" method', async () => {
    const response = await resource.delegates('123')

    expect(response.status).toBe(200)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()

    expect(response.status).toBe(200)
  })

  it('should call "balance" method', async () => {
    const response = await resource.balance('123')

    expect(response.status).toBe(200)
  })

  it('should call "publicKey" method', async () => {
    const response = await resource.publicKey('123')

    expect(response.status).toBe(200)
  })

  it('should call "top" method', async () => {
    const response = await resource.top({})

    expect(response.status).toBe(200)
  })
})
