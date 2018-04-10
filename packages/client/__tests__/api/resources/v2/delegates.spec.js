import Ark from '@/'
import network from '@/networks/ark/devnet'
import ApiResource from '@/api/resources/v2/delegates'
require('../../mocks/v2')

let resource

beforeEach(() => {
  const ark = new Ark(network)
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('delegates')
})

describe('API - 2.0 - Resources - Delegates', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    await expect(response.status).toBe(200)
  })

  it('should call "blocks" method', async () => {
    const response = await resource.blocks('123')
    await expect(response.status).toBe(200)
  })

  it('should call "voters" method', async () => {
    const response = await resource.voters('123')
    await expect(response.status).toBe(200)
  })
})
