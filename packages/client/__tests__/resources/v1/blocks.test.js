const Client = require('../../../lib')
const ApiResource = require('../../../lib/resources/v1/blocks')

const configureMocks = require('../../mocks/v1')
const host = 'https://example.net:4003'
configureMocks({ host })

let resource

beforeEach(() => {
  resource = (new Client(host)).setVersion(1).resource('blocks')
})

describe('API - 1.0 - Resources - Blocks', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all({})

    expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get(123)

    expect(response.status).toBe(200)
  })

  it('should call "epoch" method', async () => {
    const response = await resource.epoch()

    expect(response.status).toBe(200)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()

    expect(response.status).toBe(200)
  })

  it('should call "fees" method', async () => {
    const response = await resource.fees()

    expect(response.status).toBe(200)
  })

  it('should call "height" method', async () => {
    const response = await resource.height()

    expect(response.status).toBe(200)
  })

  it('should call "milestone" method', async () => {
    const response = await resource.milestone()

    expect(response.status).toBe(200)
  })

  it('should call "nethash" method', async () => {
    const response = await resource.nethash()

    expect(response.status).toBe(200)
  })

  it('should call "reward" method', async () => {
    const response = await resource.reward()

    expect(response.status).toBe(200)
  })

  it('should call "status" method', async () => {
    const response = await resource.status()

    expect(response.status).toBe(200)
  })

  it('should call "supply" method', async () => {
    const response = await resource.supply()

    expect(response.status).toBe(200)
  })
})
