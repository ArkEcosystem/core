const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v2/votes')

const configureMocks = require('../../mocks/v2')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(2).resource('votes')
})

describe('API - 2.0 - Resources - Voters', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()
    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    expect(response.status).toBe(200)
  })
})
