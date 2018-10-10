'use strict'

const TransferCommand = require('../../lib/commands/transfer')
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const mockAxios = new MockAdapter(axios)

const defaultOpts = {
  skipTesting: true,
  skipValidation: true
}
beforeEach(() => {
  // Just passthru. We'll test the Command class logic in its own test file more thoroughly
  mockAxios.onGet('http://localhost:4003/api/v2/node/configuration').reply(200, {data: {constants: {}}})
  mockAxios.onGet('http://localhost:4000/config').reply(200, {data: {network: {}}})
  jest.spyOn(axios, 'get')
  jest.spyOn(axios, 'post')
})

afterEach(() => {
  mockAxios.reset()
})

afterAll(() => mockAxios.restore())

describe('Commands - Transfer', async () => {
  it('should be a function', () => {
    expect(TransferCommand).toBeFunction()
  })

  it('should postTransactions using custom smartBridge value', async () => {
    const expectedRecipientId = 'DFyUhQW52sNB5PZdS7VD9HknwYrSNHPQDq'
    const expectedTransactionAmount = TransferCommand.__arkToArktoshi(2)
    const expectedFee = TransferCommand.__arkToArktoshi(0.1)
    const opts = {
      ...defaultOpts,
      amount: expectedTransactionAmount,
      transferFee: expectedFee,
      number: 1,
      smartBridge: 'foo bar',
      recipient: expectedRecipientId
    }
    const command = await TransferCommand.init(opts)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, {data: {}})

    await command.run()

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:4003/api/v2/transactions',
      expect.objectContaining({
        transactions: expect.arrayContaining([expect.objectContaining({
          vendorField: 'foo bar',
          amount: expectedTransactionAmount,
          fee: expectedFee,
          recipientId: expectedRecipientId
        })])
      }),
      expect.any(Object))
  })
})
