import ark from '../../../../src/client'
import ApiResource from '../../../../src/api/resources/v2/blocks'
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('blocks')
})

describe('API - 2.0 - Resources - Blocks', () => {
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

  it('should call "transactions" method', async () => {
    const response = await resource.transactions('123')
    await expect(response.status).toBe(200)
  })

  it('should call "search" method', async () => {
    const response = await resource.search({})
    await expect(response.status).toBe(200)
  })
})
