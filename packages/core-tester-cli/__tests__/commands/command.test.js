const Command = require('../../lib/commands/command')

let command
beforeEach(() => {
  command = new Command()
})

describe('Command Base', () => {
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
