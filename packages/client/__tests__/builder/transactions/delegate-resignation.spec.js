import Ark from '@/'
import network from '@/networks/ark/devnet'
import transactionTests from './__shared__/transaction'

let ark
let tx

beforeEach(() => {
  ark = new Ark(network)
  tx = ark.getBuilder().delegateResignation()

  global.tx = tx
})

describe('Delegate Resignation Transaction', () => {
  transactionTests()
})
