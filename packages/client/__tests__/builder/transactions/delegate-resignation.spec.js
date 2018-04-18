import ark from '../../../lib/client'
import transactionTests from './__shared__/transaction'

let tx

beforeEach(() => {
  tx = ark.getBuilder().delegateResignation()

  global.tx = tx
})

describe('Delegate Resignation Transaction', () => {
  transactionTests()
})
