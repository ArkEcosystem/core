const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v1/signatures')

const configureMocks = require('../../mocks/v1')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(1).resource('signatures')
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
