const app = require('./__support__/setup')

let graphql
let container

beforeAll(async () => {
  container = await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  const plugin = require('../lib').plugin

  graphql = await plugin.register(container, {
    enabled: true
  })
})

describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })
})
