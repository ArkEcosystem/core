'use strict'

const builder = require('../../lib/query-builder/sql-builder')
const { Utils } = require('sequelize')

const clauses = {
  select: {
    columns: ['reward', 'height'],
    aggregates: []
  },
  from: 'blocks',
  where: {
    and: [{
      column: 'balance',
      operator: '=',
      value: 2 * Math.pow(10, 8)
    }],
    or: []
  },
  groupBy: 'reward',
  orderBy: [{
    column: 'reward',
    direction: 'asc'
  }, {
    column: 'height',
    direction: 'desc'
  }],
  limit: 123,
  offset: 123
}

describe('Utils - SQL Builder', () => {
  beforeEach(() => {
    builder.__replacements = []
  })

  it('should be an object', () => {
    expect(builder).toBeObject()
  })

  describe('build', () => {
    it('should be a function', () => {
      expect(builder.build).toBeFunction()
    })

    it('should be ok', () => {
      let { sql, replacements } = builder.build(clauses)
      sql = Utils.format([sql].concat(replacements), 'sqlite')

      expect(sql).toBe('SELECT reward,height FROM blocks WHERE balance = 200000000 GROUP BY "reward" ORDER BY reward ASC,height DESC LIMIT 123 OFFSET 123')
    })
  })

  describe('__buildSelect', () => {
    it('should be a function', () => {
      expect(builder.__buildSelect).toBeFunction()
    })

    it('should be ok', () => {
      const clause = builder.__buildSelect(clauses)

      expect(clause).toBe('SELECT reward,height ')
    })
  })

  describe('__buildFrom', () => {
    it('should be a function', () => {
      expect(builder.__buildFrom).toBeFunction()
    })

    it('should be ok', () => {
      const clause = builder.__buildFrom(clauses)

      expect(clause).toBe('FROM blocks ')
    })
  })

  describe('__buildWhere', () => {
    it('should be a function', () => {
      expect(builder.__buildWhere).toBeFunction()
    })

    it('should be ok', () => {
      let clause = builder.__buildWhere(clauses)
      const replacements = builder.__replacements

      clause = Utils.format([clause].concat(replacements), 'sqlite')

      expect(clause).toBe('WHERE balance = 200000000 ')
    })
  })

  describe('__buildGroupBy', () => {
    it('should be a function', () => {
      expect(builder.__buildGroupBy).toBeFunction()
    })

    it('should be ok', () => {
      const clause = builder.__buildGroupBy(clauses)

      expect(clause).toBe('GROUP BY "reward" ')
    })
  })

  describe('__buildOrderBy', () => {
    it('should be a function', () => {
      expect(builder.__buildOrderBy).toBeFunction()
    })

    it('should be ok', () => {
      const clause = builder.__buildOrderBy(clauses)

      expect(clause).toBe('ORDER BY reward ASC,height DESC ')
    })
  })

  describe('__buildLimit', () => {
    it('should be a function', () => {
      expect(builder.__buildLimit).toBeFunction()
    })

    it('should be ok', () => {
      const clause = builder.__buildLimit(clauses)

      expect(clause).toBe('LIMIT 123 ')
    })
  })

  describe('__buildOffset', () => {
    it('should be a function', () => {
      expect(builder.__buildOffset).toBeFunction()
    })

    it('should be ok', () => {
      const clause = builder.__buildOffset(clauses)

      expect(clause).toBe('OFFSET 123 ')
    })
  })

  describe('__replacements', () => {
    it('should escape SQL Injection based on ""="" is always true', () => {
      const sql = 'SELECT * FROM blocks WHERE generator_public_key = ?'
      const replacements = ['\' or \'\'=\'\'']
      const formatted = Utils.format([sql].concat(replacements), 'sqlite')

      expect(formatted).toBe('SELECT * FROM blocks WHERE generator_public_key = \'\'\' or \'\'\'\'=\'\'\'\'\'')
    })

    it('should escape SQL Injection based on batched statements', () => {
      const sql = 'SELECT * FROM blocks WHERE number_of_transactions = ?'
      const replacements = ['153\'; DROP TABLE blocks']
      const formatted = Utils.format([sql].concat(replacements), 'sqlite')

      expect(formatted).toBe('SELECT * FROM blocks WHERE number_of_transactions = \'153\'\'; DROP TABLE blocks\'')
    })
  })
})
