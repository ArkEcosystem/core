'use strict'

const app = require('./__support__/setup')
const container = require('@arkecosystem/core-container')
const mockData = require('./__fixtures__/transactions')

let dynamicFeeMatch
let blockchain

beforeAll(async () => {
  const container = await app.setUp()
  await container.resolvePlugin('blockchain').start()

  dynamicFeeMatch = require('../lib/utils/dynamicfee-matcher')
})

afterAll(async () => {
  await app.tearDown()
})

describe('Dynamic Fee Matcher with dynamic fees disabled', () => {
  it('should be a function', () => {
    expect(dynamicFeeMatch).toBeFunction()
  })

  it('should accept regular transactions', () => {
    expect(dynamicFeeMatch(mockData.dummy1)).toBeTruthy()
    expect(dynamicFeeMatch(mockData.dummy2)).toBeTruthy()
  })

  it('should decline dynamic transaction', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNormalDummy1)).toBeFalsy()
  })

  it('should decline dynamic transaction fee too low', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2)).toBeFalsy()
  })

  it('should decline dynamic transaction with fee too high', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeOverTheTop)).toBeFalsy()
  })

  it('should decline dynamic transaction with fee 0', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeZero)).toBeFalsy()
  })

  it('should decline dynamic transaction with fee <0', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNegative)).toBeFalsy()
  })
})

describe('Dynamic Fee Matcher with changed minimum accepted fee', () => {
  beforeAll(async () => {
    container.resolvePlugin('config').delegates.dynamicFees.minAcceptableFee = 500000
    blockchain = container.resolvePlugin('blockchain')
    blockchain.getLastBlock = jest.fn(plugin => {
      return {
        data: {
          height: 20
        }
      }
    })
  })

  it('should accept regular transaction with normal fee', () => {
    expect(dynamicFeeMatch(mockData.dummy1)).toBeTruthy()
  })

  it('should decline dynamic transactions with fee below delegate minimum', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNormalDummy1)).toBeFalsy()
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2)).toBeFalsy()
    expect(dynamicFeeMatch(mockData.dynamicFeeOverTheTop)).toBeFalsy()
    expect(dynamicFeeMatch(mockData.dynamicFeeZero)).toBeFalsy()
    expect(dynamicFeeMatch(mockData.dynamicFeeNegative)).toBeFalsy()
  })
})

describe('Dynamic Fee Matcher with dynamic fees enabled', () => {
  beforeAll(async () => {
    container.resolvePlugin('config').delegates.dynamicFees.minAcceptableFee = 1
    blockchain = container.resolvePlugin('blockchain')
    blockchain.getLastBlock = jest.fn(plugin => {
      return {
        data: {
          height: 20
        }
      }
    })
  })

  it('should accept regular transactions', () => {
    expect(dynamicFeeMatch(mockData.dummy1)).toBeTruthy()
    expect(dynamicFeeMatch(mockData.dummy2)).toBeTruthy()
  })

  it('should accept dynamic transaction', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNormalDummy1)).toBeTruthy()
  })

  it('should decline dynamic transaction fee too low', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2)).toBeFalsy()
  })

  it('should decline dynamic transaction with fee too high', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeOverTheTop)).toBeFalsy()
  })

  it('should decline dynamic transaction with fee 0', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeZero)).toBeFalsy()
  })

  it('should decline dynamic transaction with fee <0', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNegative)).toBeFalsy()
  })
})
