'use strict'

const axios = require('axios')
const { client, transactionBuilder, NetworkManager } = require('@arkecosystem/crypto')
const apiHelpers = require('@arkecosystem/core-test-utils/lib/helpers/api')

class Helpers {
  async request (method, path, params = {}) {
    const url = `http://localhost:4003/api/${path}`
    const headers = { 'API-Version': 2 }

    const server = require('@arkecosystem/core-container').resolvePlugin('api')

    return apiHelpers.request(server, method, url, headers, params)
  }

  async requestWithAcceptHeader (method, path, params = {}) {
    const url = `http://localhost:4003/api/${path}`
    const headers = { 'Accept': 'application/vnd.ark.core-api.v2+json' }

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

  expectResource (response) {
    expect(response.data.data).toBeObject()
  }

  expectCollection (response) {
    expect(Array.isArray(response.data.data)).toBe(true)
  }

  expectPaginator (response, firstPage = true) {
    expect(response.data.meta).toBeObject()
    expect(response.data.meta).toHaveProperty('count')
    expect(response.data.meta).toHaveProperty('pageCount')
    expect(response.data.meta).toHaveProperty('totalCount')
    expect(response.data.meta).toHaveProperty('next')
    expect(response.data.meta).toHaveProperty('previous')
    expect(response.data.meta).toHaveProperty('self')
    expect(response.data.meta).toHaveProperty('first')
    expect(response.data.meta).toHaveProperty('last')
  }

  expectSuccessful (response, statusCode = 200) {
    this.expectStatus(response, statusCode)
    this.expectJson(response)
    this.assertVersion(response, 2)
  }

  expectError (response, statusCode = 404) {
    this.expectStatus(response, statusCode)
    this.expectJson(response)
    expect(response.data.statusCode).toBeNumber()
    expect(response.data.error).toBeString()
    expect(response.data.message).toBeString()
  }

  expectTransaction (transaction) {
    expect(transaction).toBeObject()
    expect(transaction).toHaveProperty('id')
    expect(transaction).toHaveProperty('blockId')
    expect(transaction).toHaveProperty('type')
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('fee')
    expect(transaction).toHaveProperty('sender')

    if ([1, 2].indexOf(transaction.type) === -1) {
      expect(transaction.recipient).toBeString()
    }

    expect(transaction.signature).toBeString()
    expect(transaction.confirmations).toBeNumber()
  }

  expectBlock (block) {
    expect(block).toBeObject()
    expect(block).toHaveProperty('id')
    expect(block).toHaveProperty('version')
    expect(block).toHaveProperty('height')
    expect(block).toHaveProperty('previous')
    expect(block).toHaveProperty('forged')
    expect(block.forged).toHaveProperty('reward')
    expect(block.forged).toHaveProperty('fee')
    expect(block).toHaveProperty('payload')
    expect(block.payload).toHaveProperty('length')
    expect(block.payload).toHaveProperty('hash')
    expect(block).toHaveProperty('generator')
    expect(block.generator).toHaveProperty('publicKey')
    expect(block).toHaveProperty('signature')
    expect(block).toHaveProperty('transactions')
  }

  expectDelegate (delegate, expected) {
    expect(delegate).toBeObject()
    expect(delegate.username).toBeString()
    expect(delegate.address).toBeString()
    expect(delegate.publicKey).toBeString()
    expect(delegate.votes).toBeNumber()
    expect(delegate.rank).toBeNumber()
    expect(delegate.blocks).toBeObject()
    expect(delegate.blocks.missed).toBeNumber()
    expect(delegate.blocks.produced).toBeNumber()
    expect(delegate.production).toBeObject()
    expect(delegate.production.approval).toBeNumber()
    expect(delegate.production.productivity).toBeNumber()
    expect(delegate.forged.fees).toBeNumber()
    expect(delegate.forged.rewards).toBeNumber()
    expect(delegate.forged.total).toBeNumber()

    Object.keys(expected || {}).forEach(attr => {
      expect(delegate[attr]).toBe(expected[attr])
    })
  }

  expectWallet (wallet) {
    expect(wallet).toBeObject()
    expect(wallet).toHaveProperty('address')
    expect(wallet).toHaveProperty('publicKey')
    expect(wallet).toHaveProperty('balance')
    expect(wallet).toHaveProperty('isDelegate')
  }

  async createTransaction () {
    client.setConfig(NetworkManager.findByName('testnet'))

    let transaction = transactionBuilder
      .transfer()
      .amount(1 * Math.pow(10, 8))
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
