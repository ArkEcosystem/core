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

  assertJson (data) {
    expect(data.body).toBeObject()
  }

  assertStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.headers).toBeObject()
    expect(data.headers).toHaveProperty('api-version', version)
  }

  assertResource (data) {
    expect(data.body.data).toBeObject()
  }

  assertCollection (data) {
    expect(Array.isArray(data.body.data)).toBe(true)
  }

  assertPaginator (data, firstPage = true) {
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

  assertSuccessful (res, statusCode = 200) {
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    this.assertVersion(res, '2')
  }

  assertError (res, statusCode = 404) {
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    expect(res.body.statusCode).toBeNumber()
    expect(res.body.error).toBeString()
    expect(res.body.message).toBeString()
  }

  assertTransaction (transaction) {
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

  assertBlock (block) {
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

  assertWallet (wallet) {
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
