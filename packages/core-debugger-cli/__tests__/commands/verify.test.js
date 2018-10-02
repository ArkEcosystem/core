'use strict'

const testSubject = require('../../lib/commands/verify')
const fixtureBlock = require('../__fixtures__/block.json')
const fixtureTransaction = require('../__fixtures__/transaction.json')

describe('Commands - Verify', () => {
  it('should be a function', () => {
    expect(testSubject).toBeFunction()
  })

  it('should verify a block', () => {
    expect(testSubject({
      data: fixtureBlock.serializedFull,
      type: 'block'
    })).toBeTrue()
  })

  it('should verify a transaction', () => {
    expect(testSubject({
      data: fixtureTransaction.serialized,
      type: 'transaction'
    })).toBeTrue()
  })
})
