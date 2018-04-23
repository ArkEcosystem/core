'use strict';

const dbinterface = require('../lib/interface')

describe('Database Interface', () => {
  it('should be an object', async () => {
    await expect(dbinterface).toBeObject()
  })

  describe('init', async () => {
    it('should be a function', async () => {
      await expect(dbinterface.init).toBeFunction()
    })
  })
})
