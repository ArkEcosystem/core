const ark = require('../../lib/client')
const HttpClient = require('../../lib/api/http')

let client

beforeEach(() => {
  client = ark.getClient('http://httpbin.org').getConnection()
})

describe('API - HTTP Client', () => {
  it('should be instantiated', () => {
    expect(client).toBeInstanceOf(HttpClient)
  })

  it('should send GET request', async () => {
    const response = await client.get('get')

    expect(response.status).toBe(200)
  })

  it('should send POST request', async () => {
    const response = await client.post('post')

    expect(response.status).toBe(200)
  })

  it('should send PUT request', async () => {
    const response = await client.put('put')

    expect(response.status).toBe(200)
  })

  it('should send PATCH request', async () => {
    const response = await client.patch('patch')

    expect(response.status).toBe(200)
  })

  it('should send DELETE request', async () => {
    const response = await client.delete('delete')

    expect(response.status).toBe(200)
  })
})
