import Ark from '@/'
import network from '@/networks/ark/devnet'
import ApiResource from '@/api/resources/v1/delegates'
require('../../mocks/v1')

let resource

beforeEach(() => {
  const ark = new Ark(network)
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('delegates')
})

describe('API - 1.0 - Resources - Delegates', () => {
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

  it('should call "count" method', async () => {
    const response = await resource.count()
    await expect(response.status).toBe(200)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()
    await expect(response.status).toBe(200)
  })

  it('should call "forged" method', async () => {
    const response = await resource.forged('123')
    await expect(response.status).toBe(200)
  })

  it('should call "search" method', async () => {
    const response = await resource.search({})
    await expect(response.status).toBe(200)
  })

  it('should call "voters" method', async () => {
    const response = await resource.voters('123')
    await expect(response.status).toBe(200)
  })
})
