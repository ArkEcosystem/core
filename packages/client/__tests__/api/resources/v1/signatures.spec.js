const ark = require('../../../../lib/client')
const ApiResource = require('../../../../lib/api/resources/v1/signatures')
require('../../mocks/v1')

let resource

beforeEach(() => {
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
