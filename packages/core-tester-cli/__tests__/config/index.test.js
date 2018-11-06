'use strict'

const config = require('../../lib/config')

describe('Config', () => {
  it('should be an object', () => {
    expect(config).toBeObject()
  })

  it('should have specific data', () => {
    expect(config).toEqual({
      apiPort: 4003,
      p2pPort: 4000,
      baseUrl: 'http://localhost',
      passphrase: 'prison tobacco acquire stone dignity palace note decade they current lesson robot',
      secondPassPhrase: ''
    })
  })
})
