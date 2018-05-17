const ark = require('../../../../lib/client')
const ApiResource = require('../../../../lib/api/resources/v2/transactions')
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('transactions')
})

describe('API - 2.0 - Resources - Transactions', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()

    expect(response.status).toBe(200)
  })

  it('should call "create" method', async () => {
    const response = await resource.create()

    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')

    expect(response.status).toBe(200)
  })

  it('should call "allUnconfirmed" method', async () => {
    const response = await resource.allUnconfirmed()

    expect(response.status).toBe(200)
  })

  it('should call "getUnconfirmed" method', async () => {
    const response = await resource.getUnconfirmed('123')

    expect(response.status).toBe(200)
  })

  it('should call "search" method', async () => {
    const response = await resource.search({})

    expect(response.status).toBe(200)
  })

  it('should call "types" method', async () => {
    const response = await resource.types()

    expect(response.status).toBe(200)
  })
})
