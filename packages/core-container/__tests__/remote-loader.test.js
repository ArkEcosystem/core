'use strict'

const RemoteLoader = require('../lib/remote-loader')
const fs = require('fs-extra')

const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const axiosMock = new MockAdapter(axios)

let testSubject
beforeEach(() => {
  testSubject = new RemoteLoader({
    remote: '127.0.0.1:4002',
    config: './config',
    data: './data'
  })

  axiosMock.onGet('http://127.0.0.1:4002/config/network').reply(() => [200, {
    data: require('../../crypto/lib/networks/ark/devnet.json')
  }])

  axiosMock.onGet('http://127.0.0.1:4002/config/genesis-block').reply(() => [200, {
    data: require('../../core/lib/config/devnet/genesisBlock.json')
  }])

  axiosMock.onGet('http://127.0.0.1:4002/config/peers').reply(() => [200, {
    data: require('../../core/lib/config/devnet/peers.json')
  }])

  axiosMock.onGet('http://127.0.0.1:4002/config/delegates').reply(() => [200, {
    data: require('../../core/lib/config/devnet/delegates.json')
  }])
})

afterEach(() => {
  axiosMock.reset()
})

describe('Remote Loader', () => {
  it('should be an object', () => {
    expect(testSubject).toBeObject()
  })

  it('should ensure the config directory exists', () => {
    expect(fs.pathExistsSync(testSubject.config)).toBeTrue()
  })

  describe('__configureNetwork', () => {
    it('should be a function', () => {
      expect(testSubject.__configureNetwork).toBeFunction()
    })

    it('should be OK', async () => {
      await testSubject.__configureNetwork()

      expect(fs.existsSync('./config/network.json')).toBeTrue()
    })
  })

  describe('__configureGenesisBlock', () => {
    it('should be a function', () => {
      expect(testSubject.__configureGenesisBlock).toBeFunction()
    })

    it('should be OK', async () => {
      await testSubject.__configureGenesisBlock()

      expect(fs.existsSync('./config/genesisBlock.json')).toBeTrue()
    })
  })

  describe('__configurePeers', () => {
    it('should be a function', () => {
      expect(testSubject.__configurePeers).toBeFunction()
    })

    it('should be OK', async () => {
      await testSubject.__configurePeers()

      expect(fs.existsSync('./config/peers.json')).toBeTrue()
    })
  })

  describe('__configureDelegates', () => {
    it('should be a function', () => {
      expect(testSubject.__configureDelegates).toBeFunction()
    })

    it('should be OK', async () => {
      await testSubject.__configureDelegates()

      expect(fs.existsSync('./config/delegates.json')).toBeTrue()
    })
  })

  describe('__configurePlugins', () => {
    it('should be a function', () => {
      expect(testSubject.__configurePlugins).toBeFunction()
    })

    it('should be OK', async () => {
      await testSubject.__configurePlugins({ name: 'devnet' })

      expect(fs.existsSync('./config/plugins.js')).toBeTrue()
    })
  })
})
