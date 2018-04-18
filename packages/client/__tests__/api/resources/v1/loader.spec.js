import ark from '../../../../src/client'
import ApiResource from '../../../../src/api/resources/v1/loader'
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('loader')
})

describe('API - 1.0 - Resources - Loader', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "status" method', async () => {
    const response = await resource.status()
    await expect(response.status).toBe(200)
  })

  it('should call "syncing" method', async () => {
    const response = await resource.syncing()
    await expect(response.status).toBe(200)
  })

  it('should call "configuration" method', async () => {
    const response = await resource.configuration()
    await expect(response.status).toBe(200)
  })
})
