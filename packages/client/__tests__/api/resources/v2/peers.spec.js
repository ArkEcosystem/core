import ark from '../../../../src/client'
import network from '../../../../src/networks/ark/devnet.json'
import ApiResource from '../../../../src/api/resources/v2/peers'
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('peers')
})

describe('API - 2.0 - Resources - Peers', () => {
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
})
