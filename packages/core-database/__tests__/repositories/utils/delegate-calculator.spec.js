'use strict';

const {
  calculateApproval,
  calculateProductivity
} = require('../../../src/repositories/utils/delegate-calculator')

const delegate = {
 balance: 1000 * Math.pow(10, 8),
 producedBlocks: 100,
 missedBlocks: 10
}

describe('Delegate Calculator', () => {
  describe('calculateApproval', async () => {
    it('should be a function', async () => {
      await expect(calculator.calculateApproval).toBeFunction()
    })

    it.skip('should calculate the approval', async () => {
      await expect(calculator.calculateApproval(delegate)).toBeFunction()
    })
  })

  describe('calculateProductivity', async () => {
    it('should be a function', async () => {
      await expect(calculator.calculateProductivity).toBeFunction()
    })

    it('should calculate the productivity', async () => {
      await expect(calculator.calculateProductivity(delegate)).toBeFunction()
    })
  })
})
