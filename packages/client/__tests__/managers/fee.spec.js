import feeManager from '../../lib/managers/fee'
import { TRANSACTION_TYPES } from '../../lib/constants'

describe('Fee Manager', () => {
  it('should be instantiated', () => {
    expect(feeManager).toBeObject()
  })

  it('should set the fee', () => {
    feeManager.set(TRANSACTION_TYPES.TRANSFER, 1)

    expect(feeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(1)
  })
})
