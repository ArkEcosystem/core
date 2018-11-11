const fs = require('fs-extra')
const mockProcess = require('jest-mock-process')

const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const RemoteLoader = require('../lib/remote-loader')

const axiosMock = new MockAdapter(axios)

let testSubject
beforeEach(() => {
  testSubject = new RemoteLoader({
    remote: '127.0.0.1:4002',
    config: './config',
    data: './data',
  })
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

    it('should not be OK', async () => {
      const mockExit = mockProcess.mockProcessExit()

      axiosMock
        .onGet('http://127.0.0.1:4002/config/network')
        .reply(() => [404, {}])

      await testSubject.__configureNetwork()

      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should be OK', async () => {
      axiosMock.onGet('http://127.0.0.1:4002/config/network').reply(() => [
        200,
        {
          data: require('../../crypto/lib/networks/ark/devnet.json'),
        },
      ])

      await testSubject.__configureNetwork()

      expect(fs.existsSync('./config/network.json')).toBeTrue()
    })
  })

  describe('__configureGenesisBlock', () => {
    it('should be a function', () => {
      expect(testSubject.__configureGenesisBlock).toBeFunction()
    })

    it('should not be OK', async () => {
      axiosMock
        .onGet('http://127.0.0.1:4002/config/genesis-block')
        .reply(() => [404, {}])

      await expect(testSubject.__configureGenesisBlock()).rejects.toThrowError()
    })

    it('should be OK', async () => {
      axiosMock
        .onGet('http://127.0.0.1:4002/config/genesis-block')
        .reply(() => [
          200,
          {
            data: require('../../core/lib/config/devnet/genesisBlock.json'),
          },
        ])

      await testSubject.__configureGenesisBlock()

      expect(fs.existsSync('./config/genesisBlock.json')).toBeTrue()
    })
  })

  describe('__configurePeers', () => {
    it('should be a function', () => {
      expect(testSubject.__configurePeers).toBeFunction()
    })

    it('should not be OK', async () => {
      const mockExit = mockProcess.mockProcessExit()

      axiosMock
        .onGet('http://127.0.0.1:4002/config/peers')
        .reply(() => [404, {}])

      await testSubject.__configurePeers()

      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should be OK', async () => {
      axiosMock.onGet('http://127.0.0.1:4002/config/peers').reply(() => [
        200,
        {
          data: require('../../core/lib/config/devnet/peers.json'),
        },
      ])

      await testSubject.__configurePeers()

      expect(fs.existsSync('./config/peers.json')).toBeTrue()
    })
  })

  describe('__configureDelegates', () => {
    it('should be a function', () => {
      expect(testSubject.__configureDelegates).toBeFunction()
    })

    it('should not be OK', async () => {
      const mockExit = mockProcess.mockProcessExit()

      axiosMock
        .onGet('http://127.0.0.1:4002/config/delegates')
        .reply(() => [404, {}])

      await testSubject.__configureDelegates()

      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should be OK', async () => {
      axiosMock.onGet('http://127.0.0.1:4002/config/delegates').reply(() => [
        200,
        {
          data: require('../../core/lib/config/devnet/delegates.json'),
        },
      ])

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
