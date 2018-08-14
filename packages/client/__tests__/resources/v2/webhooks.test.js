const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v2/webhooks')

const configureMocks = require('../../mocks/v2')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(2).resource('webhooks')
})

describe('API - 2.0 - Resources - Blocks', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()

    expect(response.status).toBe(200)
  })

  it('should call "create" method', async () => {
    const response = await resource.create()

    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')

    expect(response.status).toBe(200)
  })

  it('should call "update" method', async () => {
    const response = await resource.update('123')

    expect(response.status).toBe(200)
  })

  it('should call "delete" method', async () => {
    const response = await resource.delete('123')

    expect(response.status).toBe(200)
  })

  it('should call "events" method', async () => {
    const response = await resource.events()

    expect(response.status).toBe(200)
  })
})
