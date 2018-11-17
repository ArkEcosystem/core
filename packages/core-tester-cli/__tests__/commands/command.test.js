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

  describe('static parseFee', () => {
    it('should be a function', () => {
      expect(Command.parseFee).toBeFunction()
    })
    it('should give arktoshi', () => {
      expect(Command.parseFee(0.1).toString()).toBe('10000000')
      expect(Command.parseFee(1).toString()).toBe('100000000')
      expect(Command.parseFee(10).toString()).toBe('1000000000')
      expect(Command.parseFee('0.1').toString()).toBe('10000000')
      expect(Command.parseFee('1').toString()).toBe('100000000')
      expect(Command.parseFee('10').toString()).toBe('1000000000')
      expect(Command.parseFee('0.001-0.005').toNumber()).toBeWithin(
        100000,
        500000,
      )
    })
    it('should give negative arktoshi', () => {
      expect(Command.parseFee(-0.1).toString()).toBe('-10000000')
      expect(Command.parseFee(-1).toString()).toBe('-100000000')
      expect(Command.parseFee(-10).toString()).toBe('-1000000000')
      expect(Command.parseFee('-0.1').toString()).toBe('-10000000')
      expect(Command.parseFee('-1').toString()).toBe('-100000000')
      expect(Command.parseFee('-10').toString()).toBe('-1000000000')
    })
  })
})
