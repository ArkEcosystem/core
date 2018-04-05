const chai = require('chai')
const chaiHttp = require('chai-http')

chai.use(chaiHttp)

class Helpers {
  request (method, path, params = {}) {
    let request = chai.request('http://localhost:4003/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('API-Version', '2')
  }

  assertJson (data) {
    expect(data.body).toBeType('object')
  }

  assertStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.headers).toBeType('object')
    expect(data.headers).toHaveProperty('api-version', version)
  }

  assertResource (data) {
    expect(data.body.data).toBeType('object')
  }

  assertCollection (data) {
    expect(Array.isArray(data.body.data)).toBe(true)
  }

  assertPaginator (data, firstPage = true) {
    expect(data.body.meta).toBeType('object')
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
    expect(res.body.statusCode).toBeType('number')
    expect(res.body.error).toBeType('string')
    expect(res.body.message).toBeType('string')
  }

  assertTransaction (transaction) {
    expect(transaction).toBeType('object')
    expect(transaction.id).toBeType('string')
    expect(transaction.blockId).toBeType('string')
    expect(transaction.type).toBeType('number')
    expect(transaction.amount).toBeType('number')
    expect(transaction.fee).toBeType('number')
    expect(transaction.sender).toBeType('string')

    if ([1, 2].indexOf(transaction.type) === -1) {
      expect(transaction.recipient).toBeType('string')
    }

    expect(transaction.signature).toBeType('string')
    expect(transaction.confirmations).toBeType('number')
  }

  assertBlock (block) {
    expect(block).toBeType('object')
    expect(block.id).toBeType('string')
    expect(block.version).toBeType('number')
    expect(block.height).toBeType('number')
    // expect(block.previous).toBeType('string')

    expect(block.forged).toBeType('object')
    expect(block.forged.reward).toBeType('number')
    expect(block.forged.fee).toBeType('number')

    expect(block.payload).toBeType('object')
    expect(block.payload.length).toBeType('number')
    expect(block.payload.hash).toBeType('string')

    expect(block.generator).toBeType('object')
    expect(block.generator.publicKey).toBeType('string')

    expect(block.signature).toBeType('string')
    expect(block.transactions).toBeType('number')
  }

  assertWallet (wallet) {
    expect(wallet.address).toBeType('string')
    expect(wallet.publicKey).toBeType('string')
    expect(wallet.balance).toBeType('number')
    expect(wallet.isDelegate).toBeType('boolean')
  }
}

module.exports = new Helpers()
