'use strict'

const axios = require('axios')
const { client, transactionBuilder, NetworkManager } = require('@arkecosystem/crypto')
const apiHelpers = require('@arkecosystem/core-test-utils/lib/helpers/api')

class Helpers {
  async request (method, path, params = {}) {
    const url = `http://localhost:4003/api/${path}`
    const headers = { 'API-Version': 1 }

    const server = require('@arkecosystem/core-container').resolvePlugin('api')

    return apiHelpers.request(server, method, url, headers, params)
  }

  expectJson (response) {
    expect(response.data).toBeObject()
  }

  expectStatus (response, code) {
    expect(response.status).toBe(code)
  }

  assertVersion (response, version) {
    expect(response.headers).toBeObject()
    expect(response.headers).toHaveProperty('api-version', version)
  }

  expectState (response, state) {
    expect(response.data).toHaveProperty('success', state)
  }

  expectSuccessful (response) {
    this.expectStatus(response, 200)
    this.expectJson(response)
    this.expectState(response, true)
    this.assertVersion(response, 1)
  }

  expectError (response) {
    this.expectStatus(response, 200)
    this.expectJson(response)
    this.expectState(response, false)
    this.assertVersion(response, 1)
  }

  expectDelegate (delegate, expected) {
    expect(delegate).toBeObject()
    expect(delegate.username).toBeString()
    expect(delegate.address).toBeString()
    expect(delegate.publicKey).toBeString()
    expect(delegate.vote).toBeString()
    expect(delegate.rate).toBeNumber()
    expect(delegate.missedblocks).toBeNumber()
    expect(delegate.producedblocks).toBeNumber()
    expect(delegate.approval).toBeNumber()
    expect(delegate.productivity).toBeNumber()

    Object.keys(expected || {}).forEach(attr => {
      expect(delegate[attr]).toBe(expected[attr])
    })
  }

  expectWallet (response) {
    expect(response).toHaveProperty('username')
    expect(response).toHaveProperty('address')
    expect(response).toHaveProperty('publicKey')
    expect(response).toHaveProperty('balance')
  }

  async createTransaction () {
    client.setConfig(NetworkManager.findByName('testnet'))

    let transaction = transactionBuilder
      .transfer()
      .amount(1 * 1e8)
      .recipientId('AZFEPTWnn2Sn8wDZgCRF8ohwKkrmk2AZi1')
      .vendorField('test')
      .sign('prison tobacco acquire stone dignity palace note decade they current lesson robot')
      .getStruct()

    await axios.post('http://127.0.0.1:4003/api/v2/transactions', {
      transactions: [transaction]
    })

    return transaction
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
