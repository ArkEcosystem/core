'use strict'

const config = require('../../lib/config')

describe('Config', () => {
  it('should be an object', () => {
    expect(config).toBeObject()
  })

  it('should have specific data', () => {
    expect(config).toEqual({
      baseUrlApi: 'http://localhost:4003',
      baseUrlP2P: 'http://localhost:4000',
      passphrase: 'prison tobacco acquire stone dignity palace note decade they current lesson robot',
      secondPassPhrase: '',
      publicKeyHash: 23,
      requestHeaders: {
        nethash: 'd9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192',
        version: '2.0.0',
        port: 4000
      },
      transactionWaitDelay: 15
    })
  })
})
