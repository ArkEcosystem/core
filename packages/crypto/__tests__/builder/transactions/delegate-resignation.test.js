const ark = require('../../../lib/client')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().delegateResignation()

  global.builder = builder
})

describe('Delegate Resignation Transaction', () => {
  transactionBuilderTests()
})
