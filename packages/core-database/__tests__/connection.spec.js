'use strict';

const ConnectionInterface = require('../lib/connection')

describe('Connection Interface', () => {
  it('should be an object', async () => {
    await expect(ConnectionInterface).toBeObject()
  })

  describe('init', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.init).toBeFunction()
    })
  })
})
