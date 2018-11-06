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
  mockAxios.onGet('http://localhost:4003/api/v2/node/configuration').reply(200, { data: { constants: {} } })
  mockAxios.onGet('http://localhost:4000/config').reply(200, { data: { network: {} } })
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
    const expectedTransactionAmount = 2
    const expectedFee = 0.1
    const opts = {
      ...defaultOpts,
      amount: expectedTransactionAmount,
      transferFee: expectedFee,
      number: 1,
      smartBridge: 'foo bar',
      recipient: expectedRecipientId
    }
    const command = await TransferCommand.init(opts)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, { data: {} })
    let expectedTransactions = []
    jest.spyOn(axios, 'post').mockImplementation((uri, { transactions }) => {
      expectedTransactions = transactions
    })

    await command.run()

    expect(expectedTransactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        vendorField: 'foo bar',
        amount: TransferCommand.__arkToArktoshi(expectedTransactionAmount),
        fee: TransferCommand.__arkToArktoshi(expectedFee),
        recipientId: expectedRecipientId
      })
    ])
    )
  })

  it('should generate n transactions', async () => {
    const expectedTxCount = 5
    const opts = {
      ...defaultOpts,
      amount: TransferCommand.__arkToArktoshi(2),
      transferFee: TransferCommand.__arkToArktoshi(0.1),
      number: expectedTxCount
    }
    const command = await TransferCommand.init(opts)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, { data: {} })
    let expectedTransactions = []
    jest.spyOn(axios, 'post').mockImplementation((uri, { transactions }) => {
      expectedTransactions = transactions
    })

    await command.run()

    expect(expectedTransactions).toHaveLength(expectedTxCount)
    for (const t of expectedTransactions) {
      expect(t.vendorField).toMatch(/Transaction \d/)
      expect(t.amount).toBeDefined()
      expect(t.fee).toBeDefined()
    }
  })

  it('should send n transactions to specified recipient', async () => {
    const expectedTxCount = 10
    const expectedRecipientId = 'DFyUhQW52sNB5PZdS7VD9HknwYrSNHPQDq'
    const opts = {
      ...defaultOpts,
      amount: TransferCommand.__arkToArktoshi(2),
      transferFee: TransferCommand.__arkToArktoshi(0.1),
      number: expectedTxCount,
      recipient: expectedRecipientId
    }
    const command = await TransferCommand.init(opts)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, { data: {} })
    let expectedTransactions = []
    jest.spyOn(axios, 'post').mockImplementation((uri, { transactions }) => {
      expectedTransactions = transactions
    })

    await command.run()

    expect(expectedTransactions).toHaveLength(expectedTxCount)
    for (const t of expectedTransactions) {
      expect(t.recipientId).toEqual(expectedRecipientId)
    }
  })

  it('should sign with 2nd passphrase if specified', async () => {
    const expectedTransactionAmount = TransferCommand.__arkToArktoshi(2)
    const expectedFee = TransferCommand.__arkToArktoshi(0.1)
    const opts = {
      ...defaultOpts,
      amount: expectedTransactionAmount,
      transferFee: expectedFee,
      number: 1,
      secondPassphrase: 'she sells sea shells down by the sea shore'
    }
    const command = await TransferCommand.init(opts)
    mockAxios.onPost('http://localhost:4003/api/v2/transactions').reply(200, { data: {} })
    let expectedTransactions = []
    jest.spyOn(axios, 'post').mockImplementation((uri, { transactions }) => {
      expectedTransactions = transactions
    })

    await command.run()

    expect(expectedTransactions).toHaveLength(1)
    for (const t of expectedTransactions) {
      expect(t.secondSignature).toBeDefined()
      expect(t.signSignature).toEqual(t.secondSignature)
    }
  })
})
