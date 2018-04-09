import Ark from '@/'
import network from '@/networks/ark/devnet'
import ApiClient from '@/api'
import HttpClient from '@/api/http'
import ApiResource from '@/api/resources/v1/transactions'

let client

beforeEach(() => {
  const ark = new Ark(network)
  client = ark.getClient('https://localhost:4003')
})

describe('API - Client', () => {
  it('should be instantiated', () => {
    expect(client).toBeInstanceOf(ApiClient)
  })

  it('should set connection', () => {
    expect(client.http).toBeInstanceOf(HttpClient)
  })

  it('should return an API resource', () => {
    expect(client.resource('transactions')).toBeInstanceOf(ApiResource)
  })

  it('should set the API version', () => {
    client.setVersion(2)

    expect(client.version).toBe(2)
  })
})
