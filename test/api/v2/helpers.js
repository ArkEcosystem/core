const chai = require('chai')
const should = chai.should()

class Helpers {
  request (method, path, params = {}) {
    let request = chai
      .request('http://localhost:4003/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('Accept-Version', '2.0.0')
  }

  assertJson (data) {
    data.body.should.be.a('object')
  }

  assertStatus (data, code) {
    data.should.have.status(code)
  }

  assertVersion (data, version) {
    data.body.should.have.property('meta').which.is.an('object')
    data.body.meta.should.have.property('matchedVersion').eql(version)
  }

  assertResource (data) {
    data.body.should.have.property('data').which.is.an('object')
  }

  assertCollection (data) {
    data.body.should.have.property('data').which.is.an('array')
  }

  assertPaginator (data, firstPage = true) {
    data.body.should.have.property('links').which.is.an('object')

    if (!firstPage) {
      data.body.links.should.have.property('first').which.is.a('string')
      data.body.links.should.have.property('prev').which.is.a('string')
    }

    data.body.links.should.have.property('last').which.is.a('string')
    data.body.links.should.have.property('next').which.is.a('string')
  }

  assertSuccessful (err, res, statusCode = 200) {
    should.not.exist(err)
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    this.assertVersion(res, '2.0.0')
  }

  assertError (err, res, statusCode = 404) {
    err.should.be.an('Error')
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    res.body.should.have.property('code')
    res.body.should.have.property('message')
  }
}

module.exports = new Helpers()
