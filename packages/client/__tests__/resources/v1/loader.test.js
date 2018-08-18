const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v1/loader')

const configureMocks = require('../../mocks/v1')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(1).resource('loader')
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
