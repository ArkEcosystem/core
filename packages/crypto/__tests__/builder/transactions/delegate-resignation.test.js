const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().delegateResignation()

  global.transaction = transaction
})

describe('Delegate Resignation Transaction', () => {
  transactionTests()
})
