const Command = require('../../lib/commands/command')

let command
beforeEach(() => {
  command = new Command()
})

describe('Command Base', () => {
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
})
