const clipboardy = require('clipboardy')
const Command = require('../../lib/commands/command')

let command
beforeEach(() => {
  command = new Command()
})

describe('Command Base', () => {
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
