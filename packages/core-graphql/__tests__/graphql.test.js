const app = require('./__support__/setup')

let graphql

beforeAll(async () => {
  const container = await app.setUp()
  graphql = await container.resolvePlugin('graphql')
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })
})
