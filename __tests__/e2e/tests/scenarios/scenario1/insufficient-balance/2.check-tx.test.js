'use strict'

const testUtils = require('../../../../lib/utils/test-utils')
const utils = require('./utils')

describe('Check that only no transaction was accepted', () => {
  it('should have no transaction accepted', async () => {
    const response = await testUtils.GET('transactions')
    testUtils.expectSuccessful(response)
    
    // insufficient balance - transfer
    const txTransfers = response.data.data.filter(transaction => transaction.recipient === utils.transferRecipient.address)
    expect(txTransfers.length).toBe(0)

    // insufficient balance - transfer with 2nd signature
    const txTransfers2ndSig = response.data.data.filter(transaction => transaction.recipient === utils.transfer2ndsigRecipient.address)
    expect(txTransfers2ndSig.length).toBe(0)

    // insufficient balance - vote
    const txVotes = response.data.data.filter(transaction => transaction.sender === utils.voteSender.address)
    expect(txVotes.length).toBe(0)

    // insufficient balance - delegate registration
    const txDelReg = response.data.data.filter(transaction => transaction.sender === utils.delRegSender.address)
    expect(txDelReg.length).toBe(0)

    // insufficient balance - 2nd signature registration
    const tx2ndSigReg = response.data.data.filter(transaction => transaction.sender === utils.secondsigRegSender.address)
    expect(tx2ndSigReg.length).toBe(0)
  })
})
