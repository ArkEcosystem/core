const clipboardy = require('clipboardy')
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const Command = require('../../lib/commands/command')

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
})
