const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const SecondSignatureCommand = require('../../lib/commands/second-signature')

const mockAxios = new MockAdapter(axios)

const defaultOpts = {
  skipTesting: true,
  skipValidation: true,
}
beforeEach(() => {
  // Just passthru. We'll test the Command class logic in its own test file more thoroughly
  mockAxios
    .onGet('http://localhost:4003/api/v2/node/configuration')
    .reply(200, { data: { constants: {} } })
  mockAxios
    .onGet('http://localhost:4000/config')
    .reply(200, { data: { network: {} } })
  jest.spyOn(axios, 'get')
  jest.spyOn(axios, 'post')
})

afterEach(() => {
  mockAxios.reset()
})

describe('Commands - Second signature', () => {
  it('should be a function', () => {
    expect(SecondSignatureCommand).toBeFunction()
  })

  it('should apply second signature', async () => {
    const opts = {
      ...defaultOpts,
      signatureFee: 1,
      number: 1,
    }
    const command = await SecondSignatureCommand.init(opts)
    mockAxios
      .onPost('http://localhost:4003/api/v2/transactions')
      .reply(200, { data: {} })

    await command.run()

    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      'http://localhost:4003/api/v2/transactions',
      {
        transactions: [
          expect.objectContaining({
            fee: SecondSignatureCommand.__arkToArktoshi(opts.signatureFee),
            asset: {
              signature: {
                publicKey: expect.any(String),
              },
            },
          }),
        ],
      },
      expect.any(Object),
    )
  })
})
