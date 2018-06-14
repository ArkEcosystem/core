const toHaveHeaders = require('./matchers/http/headers')
expect.extend({ toHaveHeaders })

const HttpClient = require('../lib/http')

let client

beforeEach(() => {
  client = new HttpClient('http://httpbin.org', 2)
})

describe('API - HTTP Client', () => {
  const headers = {
    'API-version': 2,
    Nethash: 'test nethash',
    Port: '1',
    Version: 'test version (pubKeyHash)'
  }

  beforeEach(() => {
    const { configManager } = require('@arkecosystem/crypto')
    configManager.get = option => {
      if (option === 'nethash') {
        return headers.Nethash
      } else if (option === 'pubKeyHash') {
        return headers.Version
      }

      throw new Error(`Wrong option "${option}" to mock`)
    }
  })

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

  describe('get', () => {
    it('should send GET requests', async () => {
      const response = await client.get('get')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response).toHaveHeaders(headers)
    })
  })

  describe('post', () => {
    it('should send POST requests', async () => {
      const response = await client.post('post')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response).toHaveHeaders(headers)
    })
  })

  describe('put', () => {
    it('should send PUT requests', async () => {
      const response = await client.put('put')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response).toHaveHeaders(headers)
    })
  })

  describe('patch', () => {
    it('should send PATCH requests', async () => {
      const response = await client.patch('patch')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response).toHaveHeaders(headers)
    })
  })

  describe('delete', () => {
    it('should send DELETE requests', async () => {
      const response = await client.delete('delete')

      expect(response.status).toBe(200)
    })

    it('should use the necessary request headers', async () => {
      const response = await client.get('get')

      expect(response).toHaveHeaders(headers)
    })
  })
})
