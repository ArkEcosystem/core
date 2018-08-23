const constants = require('../lib/constants')

describe('Constants', () => {
  it('phantomtoshi is valid', () => {
    expect(constants.PHANTOMTOSHI).toBeDefined()
    expect(constants.PHANTOMTOSHI).toBe(100000000)
  })

  it('transaction types are defined', () => {
    expect(constants.TRANSACTION_TYPES).toBeDefined()
    expect(constants.TRANSACTION_TYPES).toBeFrozen()

    expect(constants.TRANSACTION_TYPES.TRANSFER).toBeDefined()
    expect(constants.TRANSACTION_TYPES.TRANSFER).toBe(0)

    expect(constants.TRANSACTION_TYPES.SECOND_SIGNATURE).toBeDefined()
    expect(constants.TRANSACTION_TYPES.SECOND_SIGNATURE).toBe(1)

    expect(constants.TRANSACTION_TYPES.DELEGATE_REGISTRATION).toBeDefined()
    expect(constants.TRANSACTION_TYPES.DELEGATE_REGISTRATION).toBe(2)

    expect(constants.TRANSACTION_TYPES.VOTE).toBeDefined()
    expect(constants.TRANSACTION_TYPES.VOTE).toBe(3)

    expect(constants.TRANSACTION_TYPES.MULTI_SIGNATURE).toBeDefined()
    expect(constants.TRANSACTION_TYPES.MULTI_SIGNATURE).toBe(4)

    expect(constants.TRANSACTION_TYPES.IPFS).toBeDefined()
    expect(constants.TRANSACTION_TYPES.IPFS).toBe(5)

    expect(constants.TRANSACTION_TYPES.TIMELOCK_TRANSFER).toBeDefined()
    expect(constants.TRANSACTION_TYPES.TIMELOCK_TRANSFER).toBe(6)

    expect(constants.TRANSACTION_TYPES.MULTI_PAYMENT).toBeDefined()
    expect(constants.TRANSACTION_TYPES.MULTI_PAYMENT).toBe(7)

    expect(constants.TRANSACTION_TYPES.DELEGATE_RESIGNATION).toBeDefined()
    expect(constants.TRANSACTION_TYPES.DELEGATE_RESIGNATION).toBe(8)
  })

  it('configurations are defined', () => {
    expect(constants.CONFIGURATIONS).toBeDefined()
    expect(constants.CONFIGURATIONS).toBeFrozen()

    expect(constants.CONFIGURATIONS.PHANTOM.MAINNET).toBeDefined()
    expect(constants.CONFIGURATIONS.PHANTOM.MAINNET).toBeObject()

    expect(constants.CONFIGURATIONS.PHANTOM.DEVNET).toBeDefined()
    expect(constants.CONFIGURATIONS.PHANTOM.DEVNET).toBeObject()
  })
})
