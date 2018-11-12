const app = require('./__support__/setup')
const mockData = require('./__fixtures__/transactions')

let dynamicFeeMatch
let blockchain
let container

beforeAll(async () => {
  container = await app.setUp()
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
    expect(dynamicFeeMatch(mockData.dummy1)).toBeTrue()
    expect(dynamicFeeMatch(mockData.dummy2)).toBeTrue()
  })

  it('should decline dynamic transaction', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNormalDummy1)).toBeFalse()
  })

  it('should decline dynamic transaction fee too low', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2)).toBeFalse()
  })

  it('should decline dynamic transaction with fee 0', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeZero)).toBeFalse()
  })
})

describe('Dynamic Fee Matcher with changed minimum accepted fee', () => {
  beforeAll(async () => {
    container.resolvePlugin(
      'config',
    ).delegates.dynamicFees.minAcceptableFee = 500000
    blockchain = container.resolvePlugin('blockchain')
    blockchain.getLastBlock = jest.fn(plugin => ({
      data: {
        height: 20,
      },
    }))
  })

  it('should accept regular transaction with normal fee', () => {
    expect(dynamicFeeMatch(mockData.dummy1)).toBeTrue()
  })

  it('should decline dynamic transactions with fee below minimum', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNormalDummy1)).toBeFalse()
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2)).toBeFalse()
    expect(dynamicFeeMatch(mockData.dynamicFeeZero)).toBeFalse()
  })
})

describe('Dynamic Fee Matcher with dynamic fees enabled', () => {
  beforeAll(async () => {
    container.resolvePlugin('config').delegates.dynamicFees.minAcceptableFee = 1
    blockchain = container.resolvePlugin('blockchain')
    blockchain.getLastBlock = jest.fn(plugin => ({
      data: {
        height: 20,
      },
    }))
  })

  it('should accept regular transactions', () => {
    expect(dynamicFeeMatch(mockData.dummy1)).toBeTrue()
    expect(dynamicFeeMatch(mockData.dummy2)).toBeTrue()
  })

  it('should accept dynamic transaction', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeNormalDummy1)).toBeTrue()
  })

  it('should decline dynamic transaction fee too low', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2)).toBeFalse()
  })

  it('should decline dynamic transaction with fee 0', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeZero)).toBeFalse()
  })
})
