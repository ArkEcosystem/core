const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v2/peers')
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = (new Client('https://localhost:4003')).setVersion(2).resource('peers')
})

describe('API - 2.0 - Resources - Peers', () => {
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
