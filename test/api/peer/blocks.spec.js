const node = require('test/support/node')
// TODO inject automatically
const { expect } = require('chai')

const uri = '/peer/blocks'
describe(`GET ${uri}`, function () {

  // before(() => {
  //   return node.resumeRelay()
  // })

  // FIXME stop tests
  // after(() => {
  //   return node.stopRelay()
  // })

  context('using valid headers and nethash', () => {
    it('should be OK', function () {
      // node.config.nethash = 'example'
      return node.get(uri)
        .then(response => {
          expect(response.body).to.have.property('blocks').that.is.an('array')
        })
    })

    // TODO query
    // TODO block properties are different from v1 (ark-core)
    it('should return blocks', function () {
      // node.config.nethash = 'example'
      return node.get(uri)
        .then(response => {
          expect(response.body).to.have.property('blocks').that.is.an('array')
          response.body.blocks.forEach(block => {
            expect(block).to.have.property('id').that.is.a('string')
            expect(block).to.have.property('version').that.is.a('number')
            expect(block).to.have.property('timestamp').that.is.a('number')
            expect(block).to.have.property('height').that.is.a('number')
            // Could be `null` (first block)
            expect(block).to.have.property('previousBlock')
            expect(block).to.have.property('numberOfTransactions').that.is.a('number')
            expect(block).to.have.property('totalAmount').that.is.a('number')
            expect(block).to.have.property('totalFee').that.is.a('number')
            expect(block).to.have.property('reward').that.is.a('number')
            expect(block).to.have.property('payloadLength').that.is.a('number')
            expect(block).to.have.property('payloadHash').that.is.a('string')
            expect(block).to.have.property('generatorPublicKey').that.is.a('string')
            expect(block).to.have.property('blockSignature').that.is.a('string')
            expect(block).to.have.property('transactions').that.is.an('array')
            // TODO echeck that doesn't have any other property
          })
      })
    })
  })
})

// URL IS NOT IMPLEMENTED YET
xdescribe(`POST ${uri}`, function () {

  before(function () {
    return node.startRelay()
  })

  after(function () {
    return node.stopRelay()
  })

  context('using incorrect nethash in headers', () => {
    it('should fail', function () {
      return node.post(uri, { dummy: 'dummy' })
        .set('nethash', 'incorrect')
        .end(response => {
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          expect(response.body).to.have.property('success').to.be.not.ok
          expect(response.body.expected).to.equal(node.config.nethash)
        })
    })
  })

  context('using no block', () => {
    it('should fail', function () {
      return node.post(uri)
        .then(response => {
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          expect(response.body).to.have.property('success').to.be.not.ok
          expect(response.body).to.have.property('error').that.contain('Failed to validate block schema')
        })
    })
  })

  context('using invalid block schema', () => {
    it('should fail', function () {
      const genesisBlock = node._.cloneDeep(node.genesisBlock)
      genesisBlock.blockSignature = null

      return node.post(uri, { block: genesisBlock })
        .then(response => {
          // console.log(err.red, res);
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          expect(response.body).to.have.property('success').that.is.not.ok
          expect(response.body).to.have.property('error').that.contain('Failed to validate block schema')
        })
    })
  })

  context('using valid block schema ', () => {
    it('should be OK', function () {
      const genesisBlock = node._.cloneDeep(node.genesisBlock)
      genesisBlock.transactions.forEach(transaction => {
        if (transaction.asset && transaction.asset.delegate) {
          transaction.asset.delegate.publicKey = transaction.senderPublicKey
        }
      })

      return node.post(uri, { block: genesisBlock })
        .then(res => {
        // console.log(err.red, res);
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          expect(response.body).to.have.property('success').that.is.ok
          expect(response.body).to.have.property('blockId').that.equal('17790183012548475874')
        })
    })
  })
})
