const app = require('./__support__/setup')

let graphql

beforeAll(async () => {
  const container = await app.setUp()
  graphql = await require('../lib').plugin.register(container, {
    enabled: true,
    host: 'localhost',
    port: 4005
  })
})

afterAll(async () => {
  app.tearDown()
})

describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })
})
