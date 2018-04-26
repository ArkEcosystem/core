'use strict';

let calculatorModule

beforeAll(async (done) => {
  await require('../../__support__/setup')()

  calculatorModule = require('../../../lib/repositories/utils/delegate-calculator')

  done()
})

const delegate = {
 balance: 10000000 * Math.pow(10, 8),
 producedBlocks: 100,
 missedBlocks: 10
}

describe('Delegate Calculator', () => {
  describe('calculateApproval', async () => {
    it('should be a function', async () => {
      await expect(calculatorModule.calculateApproval).toBeFunction()
    })

    it('should calculate the approval', async () => {
      await expect(calculatorModule.calculateApproval(delegate, 1)).toBe('8.00')
    })
  })

  describe('calculateProductivity', async () => {
    it('should be a function', async () => {
      await expect(calculatorModule.calculateProductivity).toBeFunction()
    })

    it('should calculate the productivity', async () => {
      await expect(calculatorModule.calculateProductivity(delegate)).toBe('90.91')
    })
  })
})
