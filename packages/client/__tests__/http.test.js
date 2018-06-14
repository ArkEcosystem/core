const HttpClient = require('../lib/http')

let client

beforeEach(() => {
  client = new HttpClient('http://httpbin.org')
})

describe('API - HTTP Client', () => {
  describe('constructor', () => {
    it('should be instantiated', () => {
      expect(client).toBeInstanceOf(HttpClient)
    })

    describe('host', () => {
      it('should set the host', () => {
        client = new HttpClient('http://ark.io')
        expect(client.host).toBe('http://ark.io')
      })

      it('should remove the final slash of the host when necessary', () => {
        client = new HttpClient('http://ark.io/')
        expect(client.host).toBe('http://ark.io')
      })

      it('should check that the host is not empty', () => {
        expect(() => new HttpClient('')).toThrow()
      })
    })

    describe('API version parameter', () => {
      it('should set the API version', () => {
        client = new HttpClient('http://example.net', 3)
        expect(client.version).toBe(3)
      })

      it('should use 1 when is not present', () => {
        client = new HttpClient('example.net')
        expect(client.version).toBe(1)
      })
    })
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
