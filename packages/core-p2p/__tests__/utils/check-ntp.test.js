const app = require('../__support__/setup')

let checker

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  checker = require('../../lib/utils/check-ntp')
})

describe('Check NTP', () => {
  const hosts = ['pool.ntp.org', 'time.google.com']
  const host = hosts[0]

  it('should be a function', () => {
    expect(checker).toBeFunction()
  })

  it('should get the time from hosts', async () => {
    const response = await checker([host])

    expect(response).toBeObject()
    expect(response.host).toBe(host)
    expect(response.time).toBeObject()
    expect(response.time.t).toBeNumber()
  })

  describe('when none of the host could be reached', () => {
    it('produces an error', async () => {
      try {
        await checker(['notime.unknown.not'])
        throw new Error('An error should have been thrown')
      } catch (error) {
        expect(error.message).toMatch(/ntp.*connect/i)
      }
    })
  })
})
