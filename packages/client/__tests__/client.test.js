const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const httpMock = new MockAdapter(axios)
const { arrayContaining } = expect

const Client = require('../lib')
const HttpClient = require('../lib/http')
const ApiResource = require('../lib/resources/v1/transactions')
const initialPeers = require('../lib/peers')

const { peers } = require('./fixtures/peers')

let client

beforeEach(() => {
  client = (new Client('https://localhost:4003'))
})

describe('API - Client', () => {
  describe('constructor', () => {
    it('should be instantiated', () => {
      expect(client).toBeInstanceOf(Client)
    })

    it('should set connection', () => {
      expect(client.http).toBeInstanceOf(HttpClient)
    })

    it('should return an API resource', () => {
      expect(client.resource('transactions')).toBeInstanceOf(ApiResource)
    })

    it('should use 1 as the default API version', () => {
      expect(client.version).toBe(1)
    })

    it('should set the API version', () => {
      client = (new Client('https://localhost:4003', 3))
      expect(client.version).toBe(3)
    })

    it('should set the HTTP client API version', () => {
      client = (new Client('https://localhost:4003', 3))
      expect(client.getConnection().version).toBe(3)
    })
  })

  describe('setVersion', () => {
    it('should set the API version', () => {
      client.setVersion(2)

      expect(client.version).toBe(2)
    })

    it('should set the API version of the HTTP client too', () => {
      client.setVersion(2)

      expect(client.http.version).toBe(2)
    })

    it('should throw an Error if the API version is falsy', async () => {
      try {
        expect(async () => client.setVersion(0)).toThrow()
        expect().fail('Should fail on the previous line')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('static findPeers', () => {
    it('should throw an Error if the network does not have initial peers', async () => {
      try {
        expect(async () => Client.findPeers('wrong')).toThrow()
        expect().fail('Should fail on the previous line')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    xit('should connect randomly to the initial peers', () => {
    })

    it('should return a sorted list of peers', async () => {
      const data = {
        success: true,
        peers
      }
      httpMock.onGet('peers').reply(200, { data })

      const foundPeers = await Client.findPeers('mainnet')
      expect(foundPeers).toEqual([
        peers[1],
        peers[3],
        peers[0],
        peers[2]
      ])
    })

    it('should ignore local peers', async () => {
      ;['127.0.0.1', '::1'].forEach(async ip => {
        const localPeer = {
          ip,
          height: 3663605,
          status: 'OK',
          delay: 17
        }
        const data = {
          success: true,
          peers: peers.concat([localPeer])
        }
        httpMock.onGet('peers').reply(200, { data })

        const foundPeers = await Client.findPeers('mainnet')
        expect(foundPeers).toEqual(arrayContaining(peers))
        expect(foundPeers).not.toContainEqual(localPeer)
      })
    })

    it('should ignore not-OK peers', async () => {
      const notOkPeer = {
        ip: '7.7.7.7',
        height: 3663605,
        status: 'not OK',
        delay: 17
      }
      const data = {
        success: true,
        peers: peers.concat([notOkPeer])
      }
      httpMock.onGet('peers').reply(200, { data })

      const foundPeers = await Client.findPeers('mainnet')
      expect(foundPeers).toEqual(arrayContaining(peers))
      expect(foundPeers).not.toContainEqual(notOkPeer)
    })

    describe('when the request to find peers fails', () => {
      it('returns the list of initial (hardcoded) peers', async () => {
        const data = {
          success: false,
          peers
        }
        httpMock.onGet('peers').reply(200, { data })

        const foundPeers = await Client.findPeers('mainnet')
        expect(foundPeers).not.toEqual(arrayContaining(peers))
        expect(foundPeers).toEqual(arrayContaining(initialPeers.mainnet))
      })
    })
  })

  describe('static connect', () => {
    it('should throw an Error if the network does not have initial peers', async () => {
      try {
        expect(async () => Client.connect('wrong')).toThrow()
        expect().fail('Should fail on the previous line')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should find peers and connect to the most updated and less delayed', async () => {
      const data = {
        success: true,
        peers
      }
      httpMock.onGet('peers').reply(200, { data })

      const client = await Client.connect('mainnet')
      expect(client.getConnection().host).toEqual(peers[1].ip)
    })
  })
})
