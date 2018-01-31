const chai = require('chai')

class Helpers {
  request (method, path, params = {}) {
    let request = chai.request('http://localhost:4003/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('Accept-Version', '2.0.0')
  }

  assertJson (data) {
    expect(data.body).toBeType('object')
  }

  assertStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.body.meta).toBeType('object')
    expect(data.body.meta).toHaveProperty('matchedVersion', version)
  }

  assertResource (data) {
    expect(data.body.data).toBeType('object')
  }

  assertCollection (data) {
    expect(Array.isArray(data.body.data)).toBe(true)
  }

  assertPaginator (data, firstPage = true) {
    expect(data.body.links).toBeType('object')

    if (!firstPage) {
      expect(data.body.links.first).toBeType('string')
      expect(data.body.links.prev).toBeType('string')
    }

    expect(data.body.links.last).toBeType('string')
    expect(data.body.links.next).toBeType('string')
  }

  assertSuccessful (err, res, statusCode = 200) {
    expect(err).toBeFalsy()
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    this.assertVersion(res, '2.0.0')
  }

  assertError (err, res, statusCode = 404) {
    expect(err).toBeType('object')
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    expect(res.body.code).toBeType('string')
    expect(res.body.message).toBeType('string')
  }

  assertTransaction (transaction) {
    expect(transaction).toBeType('object')
    expect(transaction.id).toBeType('string')
    expect(transaction.block_id).toBeType('string')
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
    expect(block.generator.public_key).toBeType('string')

    expect(block.signature).toBeType('string')
    expect(block.transactions).toBeType('number')
  }

  assertWallet(wallet) {
    expect(wallet.address).toBeType('string')
    expect(wallet.public_key).toBeType('string')
    expect(wallet.balance).toBeType('number')
    expect(wallet.is_delegate).toBeType('boolean')
  }
}

expect.extend({
  toBeAnArray(received) {
    return {
      message: () => `expected ${received} to be an array`,
      pass: Array.isArray(received),
    }
  }
})

module.exports = new Helpers()
