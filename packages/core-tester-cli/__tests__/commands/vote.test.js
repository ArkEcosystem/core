'use strict'

const VoteCommand = require('../../lib/commands/vote')
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const mockAxios = new MockAdapter(axios)

const defaultOpts = {
  skipTesting: true,
  skipValidation: true
}
beforeEach(() => {
  // Just passthru. We'll test the Command class logic in its own test file more thoroughly
  mockAxios.onGet('http://localhost:4003/api/v2/node/configuration').reply(200, { data: { constants: {} } })
  mockAxios.onGet('http://localhost:4000/config').reply(200, { data: { network: {} } })
  jest.spyOn(axios, 'get')
  jest.spyOn(axios, 'post')
})

afterEach(() => {
  mockAxios.reset()
})

afterAll(() => mockAxios.restore())

describe('Commands - Vote', () => {
  it('should be a function', () => {
    expect(VoteCommand).toBeFunction()
  })

  it('should vote for specified delegate', async () => {
    const expectedDelegate = '03f294777f7376e970b2bd4805b4a90c8449b5935d530bdb566d02800ac44a4c00'
    const opts = {
      ...defaultOpts,
      number: 1,
      voteFee: 1,
      delegate: expectedDelegate
    }
    const command = await VoteCommand.init(opts)
    mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates.*/).reply(200)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, { data: {} })

    await command.run()

    expect(axios.post).toHaveBeenNthCalledWith(2, 'http://localhost:4003/api/v2/transactions',
      {
        transactions: [
          expect.objectContaining({
            fee: VoteCommand.__arkToArktoshi(opts.voteFee),
            asset: {
              votes: [`+${expectedDelegate}`]
            }
          })
        ]
      },
      expect.any(Object))
  })

  it('should vote random delegate if non specified', async () => {
    const expectedDelegate = '03f294777f7376e970b2bd4805b4a90c8449b5935d530bdb566d02800ac44a4c00'
    const opts = {
      ...defaultOpts,
      number: 1,
      voteFee: 1,
      delegate: null
    }
    const command = await VoteCommand.init(opts)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, { data: {} })
    mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates\/.*/).reply(200) // call to delegates/{publicKey}/voters
    // call to /delegates
    mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates/).reply(200,
      {
        meta: { pageCount: 1 },
        data: [{ publicKey: expectedDelegate }]
      })

    await command.run()

    expect(axios.post).toHaveBeenNthCalledWith(2, 'http://localhost:4003/api/v2/transactions',
      {
        transactions: [
          expect.objectContaining({
            fee: VoteCommand.__arkToArktoshi(opts.voteFee),
            asset: {
              votes: [`+${expectedDelegate}`]
            }
          })
        ]
      },
      expect.any(Object))
  })
})
