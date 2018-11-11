const EventEmitter = require('eventemitter3')
const emitter = require('../lib/emitter')

let lastEmit
beforeAll(() => {
  emitter.on('fake', data => {
    lastEmit = data
  })
})

describe('Event Manager', () => {
  it('should be an instance', () => {
    expect(emitter).toBeInstanceOf(EventEmitter)
  })

  it('should emit the event', () => {
    emitter.emit('fake', 'news')

    expect(lastEmit).toBe('news')
  })
})
