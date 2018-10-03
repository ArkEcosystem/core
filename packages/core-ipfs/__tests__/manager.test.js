const app = require('./setup')

let manager = require('../lib/manager')
let container

beforeAll(async () => {
  container = await app.setUp()
})

afterAll(() => {
  app.tearDown()
})

describe('IPFSManager plugin', () => {
  it('should be instance of IPFSManager class', async () => {
    let IPFSManager = await container.resolvePlugin('ipfs')
    expect(IPFSManager).toBeInstanceOf(manager)
  })

  it('should shut off', done => {
    setTimeout(done, 6000)
  // necessary to wait for node to boot
  })
})
