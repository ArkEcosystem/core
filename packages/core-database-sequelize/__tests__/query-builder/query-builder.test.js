'use strict'

const QueryBuiler = require('../../lib/query-builder')

let builder

beforeEach(() => {
  builder = new QueryBuiler({})
  builder.__reset()
})

describe('Utils - Query Builder', () => {
  it('should be an instance', () => {
    expect(builder).toBeInstanceOf(QueryBuiler)
  })

  describe('select', () => {
    it('should be a function', () => {
      expect(builder.select).toBeFunction()
    })

    it('should be ok', () => {
      builder.select('id', 'height')

      expect(builder.clauses.select.columns).toEqual(['id', 'height'])
    })
  })

  describe('from', () => {
    it('should be a function', () => {
      expect(builder.from).toBeFunction()
    })

    it('should be ok', () => {
      builder.from('blocks')

      expect(builder.clauses.from).toBe('blocks')
    })
  })

  describe('where', () => {
    it('should be a function', () => {
      expect(builder.where).toBeFunction()
    })

    it('should be ok', () => {
      builder.where('reward', 2 * Math.pow(10, 8))

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        operator: '=',
        value: 200000000
      }])
    })
  })

  describe('whereIn', () => {
    it('should be a function', () => {
      expect(builder.whereIn).toBeFunction()
    })

    it('should be ok', () => {
      builder.whereIn('reward', [3 * Math.pow(10, 8)])

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        operator: 'IN',
        value: [300000000]
      }])
    })
  })

  describe('whereNotIn', () => {
    it('should be a function', () => {
      expect(builder.whereNotIn).toBeFunction()
    })

    it('should be ok', () => {
      builder.whereNotIn('reward', [3 * Math.pow(10, 8)])

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        operator: 'NOT IN',
        value: [300000000]
      }])
    })
  })

  describe('whereNull', () => {
    it('should be a function', () => {
      expect(builder.whereNull).toBeFunction()
    })

    it('should be ok', () => {
      builder.whereNull('reward')

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        operator: 'IS NULL'
      }])
    })
  })

  describe('whereNotNull', () => {
    it('should be a function', () => {
      expect(builder.whereNotNull).toBeFunction()
    })

    it('should be ok', () => {
      builder.whereNotNull('reward')

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        operator: 'IS NOT NULL'
      }])
    })
  })

  describe('whereBetween', () => {
    it('should be a function', () => {
      expect(builder.whereBetween).toBeFunction()
    })

    it('should be ok', () => {
      builder.whereBetween('reward', 123, 456)

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        from: 123,
        operator: 'BETWEEN',
        to: 456
      }])
    })
  })

  describe('whereNotBetween', () => {
    it('should be a function', () => {
      expect(builder.whereNotBetween).toBeFunction()
    })

    it('should be ok', () => {
      builder.whereNotBetween('reward', 123, 456)

      expect(builder.clauses.where.and).toEqual([{
        column: 'reward',
        from: 123,
        operator: 'NOT BETWEEN',
        to: 456
      }])
    })
  })

  describe('orWhere', () => {
    it('should be a function', () => {
      expect(builder.orWhere).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhere('reward', 2 * Math.pow(10, 8))

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        operator: '=',
        value: 200000000
      }])
    })
  })

  describe('orWhereIn', () => {
    it('should be a function', () => {
      expect(builder.orWhereIn).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhereIn('reward', [3 * Math.pow(10, 8)])

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        operator: 'IN',
        value: [300000000]
      }])
    })
  })

  describe('orWhereNotIn', () => {
    it('should be a function', () => {
      expect(builder.orWhereNotIn).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhereNotIn('reward', [3 * Math.pow(10, 8)])

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        operator: 'NOT IN',
        value: [300000000]
      }])
    })
  })

  describe('orWhereNull', () => {
    it('should be a function', () => {
      expect(builder.orWhereNull).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhereNull('reward')

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        operator: 'IS NULL'
      }])
    })
  })

  describe('orWhereNotNull', () => {
    it('should be a function', () => {
      expect(builder.orWhereNotNull).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhereNotNull('reward')

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        operator: 'IS NOT NULL'
      }])
    })
  })

  describe('orWhereBetween', () => {
    it('should be a function', () => {
      expect(builder.orWhereBetween).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhereBetween('reward', 123, 456)

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        from: 123,
        operator: 'BETWEEN',
        to: 456
      }])
    })
  })

  describe('orWhereNotBetween', () => {
    it('should be a function', () => {
      expect(builder.orWhereNotBetween).toBeFunction()
    })

    it('should be ok', () => {
      builder.orWhereNotBetween('reward', 123, 456)

      expect(builder.clauses.where.or).toEqual([{
        column: 'reward',
        from: 123,
        operator: 'NOT BETWEEN',
        to: 456
      }])
    })
  })

  describe('groupBy', () => {
    it('should be a function', () => {
      expect(builder.groupBy).toBeFunction()
    })

    it('should be ok', () => {
      builder.groupBy('height')

      expect(builder.clauses.groupBy).toBe('height')
    })
  })

  describe('orderBy', () => {
    it('should be a function', () => {
      expect(builder.orderBy).toBeFunction()
    })

    it('should be ok using key/value', () => {
      builder.orderBy('reward', 'desc')

      expect(builder.clauses.orderBy).toEqual([{
        column: 'reward',
        direction: 'desc'
      }])
    })

    it('should be ok using an object', () => {
      builder.orderBy({
        reward: 'desc'
      })

      expect(builder.clauses.orderBy).toEqual([{
        column: 'reward',
        direction: 'desc'
      }])
    })
  })

  describe('limit', () => {
    it('should be a function', () => {
      expect(builder.limit).toBeFunction()
    })

    it('should be ok', () => {
      builder.limit(10)

      expect(builder.clauses.limit).toBe(10)
    })
  })

  describe('offset', () => {
    it('should be a function', () => {
      expect(builder.offset).toBeFunction()
    })

    it('should be ok', () => {
      builder.offset(10)

      expect(builder.clauses.offset).toBe(10)
    })
  })

  describe('count', () => {
    it('should be a function', () => {
      expect(builder.count).toBeFunction()
    })

    it('should be ok', () => {
      builder.count('reward')

      expect(builder.clauses.select.aggregates).toEqual(['COUNT ("reward") AS "reward"'])
    })

    it('should be ok using an alias', () => {
      builder.count('reward', 'alias')

      expect(builder.clauses.select.aggregates).toEqual(['COUNT ("reward") AS "alias"'])
    })
  })

  describe('countDistinct', () => {
    it('should be a function', () => {
      expect(builder.countDistinct).toBeFunction()
    })

    it('should be ok', () => {
      builder.countDistinct('reward')

      expect(builder.clauses.select.aggregates).toEqual(['COUNT (DISTINCT "reward") AS "reward"'])
    })

    it('should be ok using an alias', () => {
      builder.countDistinct('reward', 'alias')

      expect(builder.clauses.select.aggregates).toEqual(['COUNT (DISTINCT "reward") AS "alias"'])
    })
  })

  describe('min', () => {
    it('should be a function', () => {
      expect(builder.min).toBeFunction()
    })

    it('should be ok', () => {
      builder.min('reward')

      expect(builder.clauses.select.aggregates).toEqual(['MIN ("reward") AS "reward"'])
    })

    it('should be ok using an alias', () => {
      builder.min('reward', 'alias')

      expect(builder.clauses.select.aggregates).toEqual(['MIN ("reward") AS "alias"'])
    })
  })

  describe('max', () => {
    it('should be a function', () => {
      expect(builder.max).toBeFunction()
    })

    it('should be ok', () => {
      builder.max('reward')

      expect(builder.clauses.select.aggregates).toEqual(['MAX ("reward") AS "reward"'])
    })

    it('should be ok using an alias', () => {
      builder.max('reward', 'alias')

      expect(builder.clauses.select.aggregates).toEqual(['MAX ("reward") AS "alias"'])
    })
  })

  describe('sum', () => {
    it('should be a function', () => {
      expect(builder.sum).toBeFunction()
    })

    it('should be ok', () => {
      builder.sum('reward')

      expect(builder.clauses.select.aggregates).toEqual(['SUM ("reward") AS "reward"'])
    })

    it('should be ok using an alias', () => {
      builder.sum('reward', 'alias')

      expect(builder.clauses.select.aggregates).toEqual(['SUM ("reward") AS "alias"'])
    })
  })

  describe('avg', () => {
    it('should be a function', () => {
      expect(builder.avg).toBeFunction()
    })

    it('should be ok', () => {
      builder.avg('reward')

      expect(builder.clauses.select.aggregates).toEqual(['AVG ("reward") AS "reward"'])
    })

    it('should be ok using an alias', () => {
      builder.avg('reward', 'alias')

      expect(builder.clauses.select.aggregates).toEqual(['AVG ("reward") AS "alias"'])
    })
  })

  describe('all', () => {
    it('should be a function', () => {
      expect(builder.all).toBeFunction()
    })

    it.skip('should be ok', () => {
      //
    })
  })

  describe('first', () => {
    it('should be a function', () => {
      expect(builder.first).toBeFunction()
    })

    it.skip('should be ok', () => {
      //
    })
  })

  describe('__reset', () => {
    it('should be a function', () => {
      expect(builder.__reset).toBeFunction()
    })

    it('should be ok', () => {
      expect(builder.clauses).toEqual({
        select: {
          columns: [],
          aggregates: []
        },
        where: {
          and: [],
          or: []
        }
      })
    })
  })
})
