'use strict'

const Emittery = require('emittery')
const emitter = require('../lib/emitter')

let lastEmit
beforeAll(() => {
  emitter.on('fake', (data) => (lastEmit = data))
})

describe('Event Manager', () => {
  it('should be an instance', () => {
    expect(emitter).toBeInstanceOf(Emittery)
  })

  it('should emit the event', async () => {
    await emitter.emit('fake', 'news')

    expect(lastEmit).toBe('news')
  })
})
