'use strict'

const checker = require('../../lib/utils/is-localhost')

describe('isLocalhost', () => {
  it('should be a function', async () => {
    await expect(checker).toBeFunction()
  })
})
