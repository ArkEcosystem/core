const Client = require('../lib/client')
const HttpClient = require('../lib/http')
const ApiResource = require('../lib/resources/v1/transactions')

let client

beforeEach(() => {
  client = (new Client('https://localhost:4003'))
})

describe('API - Client', () => {
  it('should be instantiated', () => {
    expect(client).toBeInstanceOf(Client)
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
