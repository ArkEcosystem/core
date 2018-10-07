'use strict'

const testSubject = require('../../lib/commands/verify-second')
const fixtureTransaction = require('../__fixtures__/transaction-second.json')

describe('Commands - Verify Second', () => {
  it('should be a function', () => {
    expect(testSubject).toBeFunction()
  })

  it('should verify a second signature', () => {
    expect(testSubject({
      data: fixtureTransaction.serialized,
      publicKey: '03699e966b2525f9088a6941d8d94f7869964a000efe65783d78ac82e1199fe609'
    })).toBeTrue()
  })
})
