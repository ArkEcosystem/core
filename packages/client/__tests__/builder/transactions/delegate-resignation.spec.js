const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let tx

beforeEach(() => {
  tx = ark.getBuilder().delegateResignation()

  global.tx = tx
})

describe('Delegate Resignation Transaction', () => {
  transactionTests()
})
