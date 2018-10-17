'use strict'

const container = require('@arkecosystem/core-container')
const roundCalculator = require('../lib/round-calculator')

container.resolvePlugin = jest.fn(plugin => {
  if (plugin === 'config') {
    return {
      getConstants: () => {
        return {
          activeDelegates: 51
        }
      }
    }
  }
})

describe('Round calculator', () => {
  describe('calculateRound', () => {
    it('should be a function', () => {
      expect(roundCalculator.calculateRound).toBeFunction()
    })

    it('should calculate the round when nextRound is the same', () => {
      const { round, nextRound } = roundCalculator.calculateRound(1)
      expect(round).toBe(1)
      expect(nextRound).toBe(1)
    })

    it('should calculate the round when nextRound is not the same', () => {
      const { round, nextRound } = roundCalculator.calculateRound(51)
      expect(round).toBe(1)
      expect(nextRound).toBe(2)
    })
  })

  describe('isNewRound', () => {
    it('should be a function', () => {
      expect(roundCalculator.isNewRound).toBeFunction()
    })

    it('should determine the beginning of a new round', () => {
      expect(roundCalculator.isNewRound(1)).toBeTrue()
      expect(roundCalculator.isNewRound(2)).toBeFalse()
      expect(roundCalculator.isNewRound(52)).toBeTrue()
    })
  })
})
