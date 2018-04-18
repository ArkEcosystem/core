import ark from '../../../src/client'
import network from '../../../src/networks/ark/devnet.json'
import transactionTests from './__shared__/transaction'

let tx

beforeEach(() => {
  tx = ark.getBuilder().delegateResignation()

  global.tx = tx
})

describe('Delegate Resignation Transaction', () => {
  transactionTests()
})
