const app = require('./__support__/setup')

let graphql
let container

beforeAll(async () => {
  container = await app.setUp()
  graphql = container.resolvePlugin('graphql')
})

afterAll(async () => {
  app.tearDown()
})

describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })
})
