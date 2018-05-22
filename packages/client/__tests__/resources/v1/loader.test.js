const Client = require('../../../lib/client')
const ApiResource = require('../../../lib/resources/v1/loader')
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = (new Client('https://localhost:4003')).setVersion(1).resource('loader')
})

describe('API - 1.0 - Resources - Loader', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "status" method', async () => {
    const response = await resource.status()

    expect(response.status).toBe(200)
  })

  it('should call "syncing" method', async () => {
    const response = await resource.syncing()

    expect(response.status).toBe(200)
  })

  it('should call "configuration" method', async () => {
    const response = await resource.configuration()

    expect(response.status).toBe(200)
  })
})
