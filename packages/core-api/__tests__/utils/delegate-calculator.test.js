'use strict'

const { Bignum } = require('@arkecosystem/crypto')
const { Wallet } = require('@arkecosystem/crypto').models
const container = require('@arkecosystem/core-container')
const delegateCalculator = require('../../lib/utils/delegate-calculator')

let delegate

beforeEach(() => {
  delegate = new Wallet('D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7')
  Object.entries({
    balance: new Bignum(109390000000),
    voteBalance: Bignum.ZERO,
    producedBlocks: 0,
    missedBlocks: 0
  }).forEach((key, value) => (delegate[key] = value))
})

describe('Delegate Calculator', () => {
  describe('calculateApproval', () => {
    it('should be a function', () => {
      expect(delegateCalculator.calculateApproval).toBeFunction()
    })

    it.skip('should calculate correctly', () => {
      delegate.voteBalance = 100000 * Math.pow(10, 8)
      container.resolvePlugin = jest.fn(plugin => {
        if (plugin === 'blockchain') {
          return {
            getLastBlock: () => {
              return {
                data: {
                  height: 1
                }
              }
            }
          }
        } else if (plugin === 'config') {
          return {
            getConstants: () => {
              return {
                height: 1,
                reward: 1 * Math.pow(10, 8)
              }
            },
            genesisBlock: {
              totalAmount: 1000000 * Math.pow(10, 8)
            }
          }
        }
      })

      expect(delegateCalculator.calculateApproval(delegate)).toBe(0.5)
    })
  })

  describe('calculateProductivity', () => {
    it('should be a function', () => {
      expect(delegateCalculator.calculateProductivity).toBeFunction()
    })

    it('should calculate correctly', () => {
      delegate.missedBlocks = 10
      delegate.producedBlocks = 100

      expect(delegateCalculator.calculateProductivity(delegate)).toBe(90.91)
    })
  })
})
