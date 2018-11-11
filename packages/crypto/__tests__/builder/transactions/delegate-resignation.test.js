const ark = require('../../../lib/client')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().delegateResignation()

  global.builder = builder
})

describe('Delegate Resignation Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty(
      'data.type',
      TRANSACTION_TYPES.DELEGATE_RESIGNATION,
    )
    expect(builder).toHaveProperty(
      'data.fee',
      feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION),
    )
  })
})
