'use strict'

const chai = require('chai')
const chaiHttp = require('chai-http')

chai.use(chaiHttp)

class Helpers {
  request (method, path, params = {}) {
    let request = chai.request('http://localhost:4003/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('API-Version', '2')
  }

  expectJson (data) {
    expect(data.body).toBeObject()
  }

  expectStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.headers).toBeObject()
    expect(data.headers).toHaveProperty('api-version', version)
  }

  expectResource (data) {
    expect(data.body.data).toBeObject()
  }

  expectCollection (data) {
    expect(Array.isArray(data.body.data)).toBe(true)
  }

  expectPaginator (data, firstPage = true) {
    expect(data.body.meta).toBeObject()
    expect(data.body.meta).toHaveProperty('count')
    expect(data.body.meta).toHaveProperty('pageCount')
    expect(data.body.meta).toHaveProperty('totalCount')
    expect(data.body.meta).toHaveProperty('next')
    expect(data.body.meta).toHaveProperty('previous')
    expect(data.body.meta).toHaveProperty('self')
    expect(data.body.meta).toHaveProperty('first')
    expect(data.body.meta).toHaveProperty('last')
  }

  expectSuccessful (data, statusCode = 200) {
    this.expectStatus(data, statusCode)
    this.expectJson(data)
    this.assertVersion(data, '2')
  }

  expectError (data, statusCode = 404) {
    this.expectStatus(data, statusCode)
    this.expectJson(data)
    expect(data.body.statusCode).toBeNumber()
    expect(data.body.error).toBeString()
    expect(data.body.message).toBeString()
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

  expectWallet (wallet) {
    expect(wallet).toBeObject()
    expect(wallet).toHaveProperty('address')
    expect(wallet).toHaveProperty('publicKey')
    expect(wallet).toHaveProperty('balance')
    expect(wallet).toHaveProperty('isDelegate')
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
