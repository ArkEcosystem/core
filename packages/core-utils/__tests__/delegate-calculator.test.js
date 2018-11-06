'use strict'

const { Bignum } = require('@arkecosystem/crypto')
const { Wallet } = require('@arkecosystem/crypto').models
const container = require('@arkecosystem/core-container')
const delegateCalculator = require('../lib/delegate-calculator')

let delegate

beforeEach(() => {
  delegate = new Wallet('D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7')
  Object.entries({
    producedBlocks: 0,
    missedBlocks: 0
  }).forEach((key, value) => (delegate[key] = value))
})

describe('Delegate Calculator', () => {
  describe('calculateApproval', () => {
    it('should be a function', () => {
      expect(delegateCalculator.calculateApproval).toBeFunction()
    })

    it('should calculate correctly', () => {
      delegate.voteBalance = new Bignum(10000 * 1e8)

      container.resolvePlugin = jest.fn(plugin => {
        if (plugin === 'config') {
          return {
            getConstants: () => {
              return {
                height: 1,
                reward: 2 * 1e8
              }
            },
            genesisBlock: {
              totalAmount: 1000000 * 1e8
            }
          }
        }
      })

      expect(delegateCalculator.calculateApproval(delegate, 1)).toBe(1)
    })

    it('should calculate correctly with 2 decimals', () => {
      delegate.voteBalance = new Bignum(16500 * 1e8)

      container.resolvePlugin = jest.fn(plugin => {
        if (plugin === 'config') {
          return {
            getConstants: () => {
              return {
                height: 1,
                reward: 2 * 1e8
              }
            },
            genesisBlock: {
              totalAmount: 1000000 * 1e8
            }
          }
        }
      })

      expect(delegateCalculator.calculateApproval(delegate, 1)).toBe(1.65)
    })
  })

  describe('calculateProductivity', () => {
    it('should be a function', () => {
      expect(delegateCalculator.calculateProductivity).toBeFunction()
    })

    it('should calculate correctly for a value above 0', () => {
      delegate.missedBlocks = 10
      delegate.producedBlocks = 100

      expect(delegateCalculator.calculateProductivity(delegate)).toBe(90.91)
    })

    it('should calculate correctly for a value of 0', () => {
      delegate.missedBlocks = 0
      delegate.producedBlocks = 0

      expect(delegateCalculator.calculateProductivity(delegate)).toBe(0.00)
    })
  })
})
