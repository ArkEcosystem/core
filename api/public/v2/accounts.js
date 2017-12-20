// accounts.js
const Router = require('restify-router').Router
const router = new Router()
const Account = require('../../../model/account')
const BlockchainManager = require('../../../core/blockchainManager')

const PATH_PREFIX = '/accounts'

function getBalance (req, res, next) {

  res.send(200, {
    success: true,
    wallet: "v2 richie rich",
  })
  next()
}

router.get({path: PATH_PREFIX + '/getBalance', version: '2.0.0'}, getBalance)

// TODO
/*'get /getBalance': 'getBalance',
  'get /getPublicKey': 'getPublickey',
  'get /delegates': 'getDelegates',
  'get /delegates/fee': 'getDelegatesFee',
  'put /delegates': 'addDelegates',
  'get /': 'getAccount'
});*/

module.exports = router
