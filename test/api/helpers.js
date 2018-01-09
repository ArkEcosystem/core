const { expect } = require('chai')

class TestValidationHelpers {

  ValidateResponseStatus(err, res, statusCode, success) {
    expect(err).to.be.a('null')
    expect(res).to.have.status(statusCode)
    expect(res).to.be.json
    expect(res.body.success).to.be.equal(success)
  }
}

module.exports = new TestValidationHelpers()
