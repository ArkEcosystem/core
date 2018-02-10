const utils = require('../utils')

describe.skip('API 2.0 - Webhooks', () => {
  describe('GET /api/webhooks', () => {
    it('should GET all the webhooks', (done) => {
      utils.request('GET', 'webhooks').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })

  describe('POST /api/webhooks', () => {
    it('should POST a new webhook', (done) => {
      utils.request('POST', 'webhooks').end((err, res) => {
        utils.assertSuccessful(err, res, 201)

        done()
      })
    })
  })

  describe('GET /api/webhooks/{id}', () => {
    it('should GET a webhook by the given id', (done) => {
      utils.request('GET', 'webhooks/{id}').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })

  describe('PUT /api/webhooks/{id}', () => {
    it('should PUT a webhook by the given id', (done) => {
      utils.request('PUT', 'webhooks/{id}').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })

  describe('DELETE /api/webhooks/{id}', () => {
    it('should DELETE a webhook by the given id', (done) => {
      utils.request('DELETE', 'webhooks/{id}').end((err, res) => {
        utils.assertSuccessful(err, res, 204)

        done()
      })
    })
  })

  describe('GET /api/webhooks/events', () => {
    it('should GET all the webhook events', (done) => {
      utils.request('GET', 'webhooks/events').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })
})
