const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v1/signatures')
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = (new Client('https://localhost:4003')).setVersion(1).resource('signatures')
})

describe('API - 1.0 - Resources - Signatures', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()

    expect(response.status).toBe(200)
  })
})
