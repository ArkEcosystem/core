const ark = require('../../../../lib/client')
const ApiResource = require('../../../../lib/api/resources/v2/statistics')
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('statistics')
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
