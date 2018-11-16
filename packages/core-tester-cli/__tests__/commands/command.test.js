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
})
