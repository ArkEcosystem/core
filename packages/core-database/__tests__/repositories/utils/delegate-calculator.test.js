'use strict'

const app = require('../../__support__/setup')
const { Bignum, constants: { ARKTOSHI } } = require('@arkecosystem/crypto')

let calculatorModule

beforeAll(async (done) => {
  await app.setUp()

  calculatorModule = require('../../../lib/repositories/utils/delegate-calculator')

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

const delegate = {
 balance: new Bignum(10000000 * ARKTOSHI),
 producedBlocks: 100,
 missedBlocks: 10
}

describe('Delegate Calculator', () => {
  describe('calculateApproval', () => {
    it('should be a function', () => {
      expect(calculatorModule.calculateApproval).toBeFunction()
    })

    it('should calculate the approval', () => {
      expect(calculatorModule.calculateApproval(delegate, 1)).toBe('8.00')
    })
  })

  describe('calculateProductivity', () => {
    it('should be a function', () => {
      expect(calculatorModule.calculateProductivity).toBeFunction()
    })

    it('should calculate the productivity', () => {
      expect(calculatorModule.calculateProductivity(delegate)).toBe('90.91')
    })
  })
})
