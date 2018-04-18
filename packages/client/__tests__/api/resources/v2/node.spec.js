import ark from '../../../../src/client'
import network from '../../../../src/networks/ark/devnet.json'
import ApiResource from '../../../../src/api/resources/v2/node'
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('node')
})

describe('API - 2.0 - Resources - Loader', () => {
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
