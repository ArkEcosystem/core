'use strict'

const testSubject = require('../../lib/commands/serialize')
const fixtureBlock = require('../__fixtures__/block.json')
const fixtureTransaction = require('../__fixtures__/transaction.json')

describe('Commands - Serialize', () => {
  it('should be a function', () => {
    expect(testSubject).toBeFunction()
  })

  it('should serialize a block (not-full)', () => {
    expect(testSubject({
      data: JSON.stringify(fixtureBlock.data),
      type: 'block',
      full: false
    })).toEqual(fixtureBlock.serialized)
  })

  it('should serialize a block (full)', () => {
    expect(testSubject({
      data: JSON.stringify(fixtureBlock.data),
      type: 'block',
      full: true
    })).toEqual(fixtureBlock.serializedFull)
  })

  it('should serialize a transaction', () => {
    expect(testSubject({
      data: JSON.stringify(fixtureTransaction.data),
      type: 'transaction'
    })).toEqual(fixtureTransaction.serialized)
  })
})
