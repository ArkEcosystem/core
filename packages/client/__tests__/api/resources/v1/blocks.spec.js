import ark from '../../../../src/client'
import network from '../../../../src/networks/ark/devnet.json'
import ApiResource from '../../../../src/api/resources/v1/blocks'
require('../../mocks/v1')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(1).resource('blocks')
})

describe('API - 1.0 - Resources - Blocks', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all({})
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    await expect(response.status).toBe(200)
  })

  it('should call "epoch" method', async () => {
    const response = await resource.epoch()
    await expect(response.status).toBe(200)
  })

  it('should call "fee" method', async () => {
    const response = await resource.fee()
    await expect(response.status).toBe(200)
  })

  it('should call "fees" method', async () => {
    const response = await resource.fees()
    await expect(response.status).toBe(200)
  })

  it('should call "height" method', async () => {
    const response = await resource.height()
    await expect(response.status).toBe(200)
  })

  it('should call "milestone" method', async () => {
    const response = await resource.milestone()
    await expect(response.status).toBe(200)
  })

  it('should call "nethash" method', async () => {
    const response = await resource.nethash()
    await expect(response.status).toBe(200)
  })

  it('should call "reward" method', async () => {
    const response = await resource.reward()
    await expect(response.status).toBe(200)
  })

  it('should call "status" method', async () => {
    const response = await resource.status()
    await expect(response.status).toBe(200)
  })

  it('should call "supply" method', async () => {
    const response = await resource.supply()
    await expect(response.status).toBe(200)
  })
})
