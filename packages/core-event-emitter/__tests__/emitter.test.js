'use strict'

const EventEmitter = require('eventemitter3')
const emitter = require('../lib/emitter')

let lastEmit
beforeAll(() => {
  emitter.on('fake', (data) => (lastEmit = data))
})

describe('Event Manager', () => {
  it('should be an object', async () => {
    await expect(emitter).toBeInstanceOf(EventEmitter)
  })

  it('should be an object', async () => {
    emitter.emit('fake', 'news')

    await expect(lastEmit).toBe('news')
  })
})
