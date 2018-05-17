'use strict'

const isLocalhost = require('../../lib/utils/is-localhost')

describe('isLocalhost', () => {
  it('should be a function', () => {
    expect(isLocalhost).toBeFunction()
  })

  it('should be ok for ::1', () => {
    expect(isLocalhost('::1')).toBeTruthy()
  })

  it('should be ok for 127.0.0.1', () => {
    expect(isLocalhost('127.0.0.1')).toBeTruthy()
  })

  it('should be ok for ::ffff:127.0.0.1', () => {
    expect(isLocalhost('::ffff:127.0.0.1')).toBeTruthy()
  })

  it('should not be ok', () => {
    expect(isLocalhost('dummy')).toBeFalsy()
  })
})
