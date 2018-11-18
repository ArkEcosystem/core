const clipboardy = require('clipboardy')
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const Command = require('../../lib/commands/command')
const logger = require('../../lib/utils/logger')

const mockAxios = new MockAdapter(axios)

let command
beforeEach(() => {
  command = new Command()
  mockAxios.reset()
})

describe('Command Base', () => {
  describe('Init', () => {
    it('should be a function', () => {
      expect(Command.init).toBeFunction()
    })
    it('init w/ option', async () => {
      mockAxios
        .onGet('http://test_baseUrl:1234/api/v2/node/configuration')
        .reply(200, { data: { constants: {} } })
      mockAxios
        .onGet('http://test_baseUrl:4321/config')
        .reply(200, { data: { network: {} } })
      command = await Command.init({
        baseUrl: 'http://test_baseUrl',
        apiPort: 1234,
        p2pPort: 4321,
        passphrase: 'test_passphrase',
        secondPassphrase: 'test_secondPassphrase',
      })
      expect(command.config).toContainEntries([
        ['baseUrl', 'http://test_baseUrl'],
        ['apiPort', 1234],
        ['p2pPort', 4321],
        ['passphrase', 'test_passphrase'],
        ['secondPassphrase', 'test_secondPassphrase'],
      ])
    })
  })
  
  describe('Copy to Clipboard', () => {
    it('should be a function', () => {
      expect(command.copyToClipboard).toBeFunction()
    })

    it('should contain the copied content', () => {
      command.copyToClipboard([
        {
          key: 'value',
          serialized: '00',
        },
      ])

      expect(JSON.parse(clipboardy.readSync())).toEqual([
        {
          key: 'value',
          serialized: '00',
        },
      ])
    })
  })

  describe('Run', () => {
    it('should be a function', () => {
      expect(command.run).toBeFunction()
    })
    it('throw expception', () => {
      expect(command.run).toThrowWithMessage(
        Error,
        'Method [run] not implemented!',
      )
    })
  })

  describe('Generate Wallets', () => {
    it('should be a function', () => {
      expect(command.generateWallets).toBeFunction()
    })
    it('generate wallets', () => {
      command.config = {
        network: {
          version: 1,
        },
      }
      const wallets = command.generateWallets(10)
      expect(wallets).toBeArrayOfSize(10)
      wallets.forEach(wallet => {
        expect(wallet).toContainAllKeys(['address', 'keys', 'passphrase'])
      })
    })
  })

  describe('__applyConfig', () => {
    it('should be a function', () => {
      expect(command.__applyConfig).toBeFunction()
    })
    it('should sets constant', () => {
      command.options = {
        baseUrl: 'http://baseUrl///',
        apiPort: 1234,
        p2pPort: 4321,
        passphrase: 'test_passphrase',
        secondPassphrase: 'test_secondPassphrase',
      }

      command.__applyConfig()

      expect(command.config.baseUrl).toBe('http://baseUrl')
      expect(command.config.apiPort).toBe(1234)
      expect(command.config.p2pPort).toBe(4321)
      expect(command.config.passphrase).toBe('test_passphrase')
      expect(command.config.secondPassphrase).toBe('test_secondPassphrase')
    })
  })

  describe('__loadConstants', () => {
    it('should be a function', () => {
      expect(command.__loadConstants).toBeFunction()
    })
    it('should sets constant', async () => {
      command.config = {
        baseUrl: 'http://baseUrl',
        apiPort: 1234,
      }
      mockAxios
        .onGet('http://baseUrl:1234/api/v2/node/configuration')
        .reply(200, {
          data: {
            constants: {
              testConstant: true,
              testConstant2: 'test',
            },
          },
        })

      await command.__loadConstants()

      expect(command.config.constants).toContainAllEntries([
        ['testConstant', true],
        ['testConstant2', 'test'],
      ])
    })
  })

  describe('__loadNetworkConfig', () => {
    it('should be a function', () => {
      expect(command.__loadNetworkConfig).toBeFunction()
    })
    it('should sets constant', async () => {
      command.config = {
        baseUrl: 'http://baseUrl',
        p2pPort: 4321,
      }
      mockAxios.onGet('http://baseUrl:4321/config').reply(200, {
        data: {
          network: {
            testConfig: true,
            testConfig2: 'test',
          },
        },
      })

      await command.__loadNetworkConfig()

      expect(command.config.network).toContainAllEntries([
        ['testConfig', true],
        ['testConfig2', 'test'],
      ])
    })
  })

  describe('static __arkToArktoshi', () => {
    it('should be a function', () => {
      expect(Command.__arkToArktoshi).toBeFunction()
    })
    it('should give arktoshi', () => {
      expect(Command.__arkToArktoshi(0.1).toString()).toBe('10000000')
      expect(Command.__arkToArktoshi(1).toString()).toBe('100000000')
      expect(Command.__arkToArktoshi(10).toString()).toBe('1000000000')
    })
  })

  describe('static __arktoshiToArk', () => {
    it('should be a function', () => {
      expect(Command.__arktoshiToArk).toBeFunction()
    })
    it('should give ark', () => {
      expect(Command.__arktoshiToArk(10000000)).toBe('0.1 DѦ')
      expect(Command.__arktoshiToArk(100000000)).toBe('1 DѦ')
      expect(Command.__arktoshiToArk(1000000000)).toBe('10 DѦ')
    })
  })

  describe('__problemSendingTransactions', () => {
    it('should be a function', () => {
      expect(command.__problemSendingTransactions).toBeFunction()
    })
    it('should log message and exit', () => {
      const processExit = process.exit
      const loggerError = logger.error
      process.exit = jest.fn()
      logger.error = jest.fn()
      const message = '__problemSendingTransactions message'
      command.__problemSendingTransactions({
        message,
      })
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(
        `There was a problem sending transactions: ${message}`,
      )
      expect(process.exit).toHaveBeenCalledTimes(1)
      process.exit = processExit
      logger.error = loggerError
    })
  })
})
