'use strict'

const clause = require('../../../../lib/query-builder/clauses/where')

describe('Clauses - Where', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  describe('2 Parameters', () => {
    it('should be ok using values', () => {
      expect(clause(['balance', 123])).toEqual([{
        column: 'balance',
        operator: '=',
        value: 123
      }])
    })

    it('should be ok using an object', () => {
      expect(clause([{
        balance: 123,
        height: 456
      }])).toEqual([{
        column: 'balance',
        operator: '=',
        value: 123
      }, {
        column: 'height',
        operator: '=',
        value: 456
      }])
    })
  })

  describe('3 Parameters', () => {
    it('should be ok using values', () => {
      expect(clause(['balance', '>=', 123])).toEqual([{
        column: 'balance',
        operator: '>=',
        value: 123
      }])
    })
  })
})
