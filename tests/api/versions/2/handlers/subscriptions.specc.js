const utils = require('../utils')

describe.skip('API 2.0 - Subscriptions', () => {
  describe('GET /api/subscriptions', () => {
    it('should GET all the subscriptions', (done) => {
      utils.request('GET', 'subscriptions').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })

  describe('POST /api/subscriptions', () => {
    it('should POST a new subscription', (done) => {
      utils.request('POST', 'subscriptions').end((err, res) => {
        utils.assertSuccessful(err, res, 201)

        done()
      })
    })
  })

  describe('GET /api/subscriptions/{id}', () => {
    it('should GET a subscription by the given id', (done) => {
      utils.request('GET', 'subscriptions/{id}').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })

  describe('PUT /api/subscriptions/{id}', () => {
    it('should PUT a subscription by the given id', (done) => {
      utils.request('PUT', 'subscriptions/{id}').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })

  describe('DELETE /api/subscriptions/{id}', () => {
    it('should DELETE a subscription by the given id', (done) => {
      utils.request('DELETE', 'subscriptions/{id}').end((err, res) => {
        utils.assertSuccessful(err, res, 204)

        done()
      })
    })
  })

  describe('GET /api/subscriptions/events', () => {
    it('should GET all the subscription events', (done) => {
      utils.request('GET', 'subscriptions/events').end((err, res) => {
        utils.assertSuccessful(err, res)

        done()
      })
    })
  })
})
