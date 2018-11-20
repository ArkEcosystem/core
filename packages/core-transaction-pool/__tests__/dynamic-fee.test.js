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

describe('static fees', () => {
  beforeAll(() => {
    blockchain = container.resolvePlugin('blockchain')
    blockchain.getLastBlock = jest.fn(plugin => ({
      data: {
        height: 20,
      },
    }))
    const h = blockchain.getLastBlock().data.height
    container.resolvePlugin('config').getConstants(h).fees.dynamic = false
  })

  it('should be a function', () => {
    expect(dynamicFeeMatch).toBeFunction()
  })

  it('should accept transactions matching the static fee for broadcast', () => {
    expect(dynamicFeeMatch(mockData.dummy1).broadcast).toBeTrue()
    expect(dynamicFeeMatch(mockData.dummy2).broadcast).toBeTrue()
  })

  it('should accept transactions matching the static fee to enter pool', () => {
    expect(dynamicFeeMatch(mockData.dummy1).enterPool).toBeTrue()
    expect(dynamicFeeMatch(mockData.dummy2).enterPool).toBeTrue()
  })

  it('should not broadcast transactions with a fee other than the static fee', () => {
    expect(
      dynamicFeeMatch(mockData.dynamicFeeNormalDummy1).broadcast,
    ).toBeFalse()
    expect(dynamicFeeMatch(mockData.dynamicFeeZero).broadcast).toBeFalse()
  })

  it('should not allow transactions with a fee other than the static fee to enter the pool', () => {
    expect(
      dynamicFeeMatch(mockData.dynamicFeeNormalDummy1).enterPool,
    ).toBeFalse()
    expect(dynamicFeeMatch(mockData.dynamicFeeZero).enterPool).toBeFalse()
  })
})

describe('dynamic fees', () => {
  beforeAll(() => {
    blockchain = container.resolvePlugin('blockchain')
    blockchain.getLastBlock = jest.fn(plugin => ({
      data: {
        height: 20,
      },
    }))
    const h = blockchain.getLastBlock().data.height
    container.resolvePlugin('config').getConstants(h).fees.dynamic = true
  })

  it('should broadcast transactions with high enough fee', () => {
    expect(dynamicFeeMatch(mockData.dummy1).broadcast).toBeTrue()
    expect(dynamicFeeMatch(mockData.dummy2).broadcast).toBeTrue()
    expect(
      dynamicFeeMatch(mockData.dynamicFeeNormalDummy1).broadcast,
    ).toBeTrue()
  })

  it('should accept transactions with high enough fee to enter the pool', () => {
    expect(dynamicFeeMatch(mockData.dummy1).enterPool).toBeTrue()
    expect(dynamicFeeMatch(mockData.dummy2).enterPool).toBeTrue()
    expect(
      dynamicFeeMatch(mockData.dynamicFeeNormalDummy1).enterPool,
    ).toBeTrue()
  })

  it('should not broadcast transactions with too low fee', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2).broadcast).toBeFalse()
    expect(dynamicFeeMatch(mockData.dynamicFeeZero).broadcast).toBeFalse()
  })

  it('should not allow transactions with too low fee to enter the pool', () => {
    expect(dynamicFeeMatch(mockData.dynamicFeeLowDummy2).enterPool).toBeFalse()
    expect(dynamicFeeMatch(mockData.dynamicFeeZero).enterPool).toBeFalse()
  })
})
