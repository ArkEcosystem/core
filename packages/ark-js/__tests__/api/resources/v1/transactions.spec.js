import Ark from '@/'
import network from '@/networks/ark/devnet'
import ApiResource from '@/api/resources/v1/transactions'
require('../../mocks/v1')

let resource

beforeEach(() => {
  const ark = new Ark(network)
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('transactions')
})

describe('API - 1.0 - Resources - Transactions', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all({})
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    await expect(response.status).toBe(200)
  })

  it('should call "allUnconfirmed" method', async () => {
    const response = await resource.allUnconfirmed({})
    await expect(response.status).toBe(200)
  })

  it('should call "getUnconfirmed" method', async () => {
    const response = await resource.getUnconfirmed('123')
    await expect(response.status).toBe(200)
  })
})
