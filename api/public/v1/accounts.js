// accounts.js
const Router = require('restify-router').Router
const router = new Router()
const Account = require('../../../model/account')
const BlockchainManager = require('../../../core/blockchainManager')

const PATH_PREFIX = '/accounts'


function getBalance (req, res, next) {

  res.send(200, {
    success: true,
    wallet: "v1 richie rich",
  })
  next()

  /*
  //library.schema.validate(req.body, schema.getBalance, function (err) {

  var isAddress = /^[1-9A-Za-z]{1,35}$/g
  /*if (!isAddress.test(req.body.address)) {
    return cb('Invalid address')
  }

  BlockchainManager.getInstance().db.
  Account.findById(req.body.address).then(account => {
    res.send(200, account)
    next()
  })
*/

    /*self.getAccount({ address: req.body.address }, function (err, account) {
      if (err) {
        return cb(err);
      }

      var balance = account ? account.balance : '0';
      var unconfirmedBalance = account ? account.u_balance : '0';

      return cb(null, {balance: balance, unconfirmedBalance: unconfirmedBalance});
    });*/
}



router.get({path: PATH_PREFIX + '/getBalance', version: '1.0.0'}, getBalance)

// TODO
/*'get /getBalance': 'getBalance',
  'get /getPublicKey': 'getPublickey',
  'get /delegates': 'getDelegates',
  'get /delegates/fee': 'getDelegatesFee',
  'put /delegates': 'addDelegates',
  'get /': 'getAccount'
});*/



module.exports = router
