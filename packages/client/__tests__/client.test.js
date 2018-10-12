const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const httpMock = new MockAdapter(axios)
const { arrayContaining } = expect

const Client = require('../lib')
const HttpClient = require('../lib/http')
const ApiResource = require('../lib/resources/v1/transactions')
const initialPeers = require('../lib/peers')

// https://github.com/facebook/jest/issues/3601
const errorCapturer = fn => fn.then(res => () => res).catch(err => () => { throw err })

const host = 'https://example.net:4003'
const { peers, peersOverride } = require('./fixtures/peers')

let client

beforeEach(() => {
  client = (new Client(host))
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
      expect(client.setVersion).toThrowError(/api.*version/i)
    })
  })

  describe('static findPeers', () => {
    it('should throw an Error if the network does not have initial peers', async () => {
      expect(await errorCapturer(Client.findPeers('wrong'))).toThrowError(/network.*wrong/i)
    })

    xit('should connect randomly to the initial peers', () => {
    })

    it('should return a sorted list of peers', async () => {
      const data = {
        success: true,
        peers
      }

      peers.forEach(peer => {
        httpMock.onGet(/http.*\/api\/peers/).reply(200, data)
      })

      const foundPeers = await Client.findPeers('devnet')
      expect(foundPeers).toEqual([
        peers[1],
        peers[3],
        peers[0],
        peers[2]
      ])
    })

    it('should ignore local peers', async () => {
      const ips = ['127.0.0.1', '::ffff:127.0.0.1', '::1']

      expect.assertions(ips.length * 2)

      for (const ip of ips) {
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

        peers.forEach(peer => {
          httpMock.onGet(/http.*\/api\/peers/).reply(200, data)
        })

        const foundPeers = await Client.findPeers('devnet')
        expect(foundPeers).toEqual(arrayContaining(peers))
        expect(foundPeers).not.toContainEqual(localPeer)
      }
    })

    it('should ignore not-OK peers', async () => {
      const notOkPeer = {
        ip: '7.7.7.7',
        port: 3333,
        height: 3663605,
        status: 'not OK',
        delay: 17
      }
      const data = {
        success: true,
        peers: peers.concat([notOkPeer])
      }

      peers.forEach(peer => {
        httpMock.onGet(/http.*\/api\/peers/).reply(200, data)
      })

      const foundPeers = await Client.findPeers('devnet')
      expect(foundPeers).toEqual(arrayContaining(peers))
      expect(foundPeers).not.toContainEqual(notOkPeer)
    })

    xdescribe('when a peer is not valid', () => {
      it('tries others', () => {
      })
    })

    describe('when the request to find peers fails', () => {
      beforeEach(() => {
        peers.forEach(peer => {
          httpMock.onGet(/http.*\/api\/peers/).reply(500)
        })
      })

      it('returns the list of initial (hardcoded) peers', async () => {
        const foundPeers = await Client.findPeers('devnet')
        expect(foundPeers).not.toEqual(arrayContaining(peers))
        expect(foundPeers).toEqual(arrayContaining(initialPeers.devnet))
      })

      it('should return the list of provided peers', async () => {
        const foundPeers = await Client.findPeers('devnet', 2, peersOverride)
        expect(foundPeers).not.toEqual(arrayContaining(peers))
        expect(foundPeers).toEqual(arrayContaining(peersOverride))
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
    it('should not throw an Error if the network does not exist but peers overridden', async () => {
      try {
        await Client.connect('wrong', 2, peersOverride)
      } catch (error) {
        expect().fail('Should not have failed on the previous line')
      }
    })

    it('should find peers and connect to the most updated and less delayed', async () => {
      const data = {
        success: true,
        peers
      }
      peers.forEach(peer => {
        httpMock.onGet(/http.*\/api\/peers/).reply(200, data)
      })

      const client = await Client.connect('devnet')
      expect(client.getConnection().host).toEqual(`http://${peers[1].ip}:${peers[1].port}`)
    })
  })
})
