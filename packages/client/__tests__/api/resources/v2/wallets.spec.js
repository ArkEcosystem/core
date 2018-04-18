import ark from '../../../../src/client'
import ApiResource from '../../../../src/api/resources/v2/wallets'
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('wallets')
})

describe('API - 2.0 - Resources - Webhooks', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()
    await expect(response.status).toBe(200)
  })

  it('should call "top" method', async () => {
    const response = await resource.top()
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    await expect(response.status).toBe(200)
  })

  it('should call "transactions" method', async () => {
    const response = await resource.transactions('123')
    await expect(response.status).toBe(200)
  })

  it('should call "transactionsSent" method', async () => {
    const response = await resource.transactionsSent('123')
    await expect(response.status).toBe(200)
  })

  it('should call "transactionsReceived" method', async () => {
    const response = await resource.transactionsReceived('123')
    await expect(response.status).toBe(200)
  })

  it('should call "votes" method', async () => {
    const response = await resource.votes('123')
    await expect(response.status).toBe(200)
  })

  it('should call "search" method', async () => {
    const response = await resource.search({})
    await expect(response.status).toBe(200)
  })
})
