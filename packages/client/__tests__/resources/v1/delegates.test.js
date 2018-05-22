const Client = require('../../../lib/client')
const ApiResource = require('../../../lib/resources/v1/delegates')
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = (new Client('https://localhost:4003')).setVersion(1).resource('delegates')
})

describe('API - 1.0 - Resources - Delegates', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all({})

    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')

    expect(response.status).toBe(200)
  })

  it('should call "count" method', async () => {
    const response = await resource.count()

    expect(response.status).toBe(200)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()

    expect(response.status).toBe(200)
  })

  it('should call "forged" method', async () => {
    const response = await resource.forged('123')

    expect(response.status).toBe(200)
  })

  it('should call "search" method', async () => {
    const response = await resource.search({})

    expect(response.status).toBe(200)
  })

  it('should call "voters" method', async () => {
    const response = await resource.voters('123')

    expect(response.status).toBe(200)
  })
})
