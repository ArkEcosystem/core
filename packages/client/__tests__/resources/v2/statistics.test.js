const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v2/statistics')

const configureMocks = require('../../mocks/v2')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(2).resource('statistics')
})

describe('API - 2.0 - Resources - Statistics', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "blockchain" method', async () => {
    const response = await resource.blockchain()

    expect(response.status).toBe(200)
  })

  it('should call "transactions" method', async () => {
    const response = await resource.transactions()

    expect(response.status).toBe(200)
  })

  it('should call "blocks" method', async () => {
    const response = await resource.blocks()

    expect(response.status).toBe(200)
  })

  it('should call "votes" method', async () => {
    const response = await resource.votes()

    expect(response.status).toBe(200)
  })

  it('should call "unvotes" method', async () => {
    const response = await resource.unvotes()

    expect(response.status).toBe(200)
  })
})
