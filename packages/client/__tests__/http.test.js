const toHaveAtLeastHeaders = require('./matchers/http/headers')
expect.extend({ toHaveAtLeastHeaders })

const HttpClient = require('../lib/http')

let client

beforeEach(() => {
  client = new HttpClient('http://httpbin.org', 2)
})

describe('API - HTTP Client', () => {
  let headers

  beforeEach(() => {
    headers = {
      'API-Version': client.version
    }
  })

  describe('constructor', () => {
    it('should be instantiated', () => {
      expect(client).toBeInstanceOf(HttpClient)
    })

    describe('host', () => {
      it('should set the host', () => {
        client = new HttpClient('http://phantom.org')
        expect(client.host).toBe('http://phantom.org')
      })

      it('should remove the final slash of the host when necessary', () => {
        client = new HttpClient('http://phantom.org/')
        expect(client.host).toBe('http://phantom.org')
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

  describe('setTimeout', () => {
    it('should set the timeout', () => {
      expect(client.timeout).toBe(60000)
      client.setTimeout(5000)
      expect(client.timeout).toBe(5000)
    })
  })

  describe('setHeaders', () => {
    it('should set the headers', () => {
      const newHeaders = {
        'API-Version': 30,
        other: 'value'
      }
      client.setHeaders(newHeaders)

      expect(client.headers).toEqual(newHeaders)
    })
  })

  describe('get', () => {
    it('should send GET requests', async () => {
      const response = await client.get('get')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response.config).toHaveAtLeastHeaders(headers)
    })
  })

  describe('post', () => {
    it('should send POST requests', async () => {
      const response = await client.post('post')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response.config).toHaveAtLeastHeaders(headers)
    })
  })

  describe('put', () => {
    it('should send PUT requests', async () => {
      const response = await client.put('put')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response.config).toHaveAtLeastHeaders(headers)
    })
  })

  describe('patch', () => {
    it('should send PATCH requests', async () => {
      const response = await client.patch('patch')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response.config).toHaveAtLeastHeaders(headers)
    })
  })

  describe('delete', () => {
    it('should send DELETE requests', async () => {
      const response = await client.delete('delete')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response.config).toHaveAtLeastHeaders(headers)
    })
  })
})
