const ark = require('../../../../lib/client')
const ApiResource = require('../../../../lib/api/resources/v1/accounts')
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('accounts')
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
