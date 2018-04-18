import ark from '../../../../src/client'
import ApiResource from '../../../../src/api/resources/v1/peers'
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('peers')
})

describe('API - 1.0 - Resources - Peers', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all({})
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('127.0.0.1', 4001)
    await expect(response.status).toBe(200)
  })

  it('should call "version" method', async () => {
    const response = await resource.version()
    await expect(response.status).toBe(200)
  })
})
