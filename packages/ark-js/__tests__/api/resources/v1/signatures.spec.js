import Ark from '@/'
import network from '@/networks/ark/devnet'
import ApiResource from '@/api/resources/v1/signatures'
require('../../mocks/v1')

let resource

beforeEach(() => {
  const ark = new Ark(network)
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('signatures')
})

describe('API - 1.0 - Resources - Signatures', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()
    await expect(response.status).toBe(200)
  })
})
