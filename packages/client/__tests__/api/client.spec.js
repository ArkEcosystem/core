import ark from '../../lib/client'
import ApiClient from '../../lib/api'
import HttpClient from '../../lib/api/http'
import ApiResource from '../../lib/api/resources/v1/transactions'

let client

beforeEach(() => {
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
