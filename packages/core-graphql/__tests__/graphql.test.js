const app = require('./__support__/setup')

let graphql
let logger

const { testQueries,
        testData,
        testExpected,
        testHistory
      } = require('./__fixtures__')

beforeAll(async () => {
  const container = await app.setUp()
  graphql = await container.resolvePlugin('graphql')
  logger = await container.resolvePlugin('logger')
  logger.info('Starting GraphQL Tests!')
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })

  describe('test queries', () => {
    it('should be an object', () => {
      expect(testQueries).toBeObject()
    })
  })

  describe('test data', () => {
    it('should be an object', () => {
      expect(testData).toBeObject()
    })
  })

  describe('test expected', () => {
    it('should be an object', () => {
      expect(testExpected).toBeObject()
    })
  })

  describe('test history', () => {
    xit('should be an object', () => { //empty json for the moment, will change
      expect(testHistory).toBeObject()
    })
  })
})
