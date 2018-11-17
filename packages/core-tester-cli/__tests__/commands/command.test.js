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
})
