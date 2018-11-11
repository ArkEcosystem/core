const configManager = require('../../lib/managers/config')
const feeManager = require('../../lib/managers/fee')
const dynamicFeeManager = require('../../lib/managers/dynamic-fee')
const network = require('../../lib/networks/ark/devnet.json')
const networkMainnet = require('../../lib/networks/ark/mainnet.json')
const { TRANSACTION_TYPES } = require('../../lib/constants')

beforeEach(() => configManager.setConfig(network))

describe('Configuration', () => {
  it('should be instantiated', () => {
    expect(configManager).toBeObject()
  })

  it('should be set on runtime', () => {
    configManager.setConfig(networkMainnet)

    expect(configManager.all()).toEqual(networkMainnet)
  })

  it('key should be "set"', () => {
    configManager.set('key', 'value')

    expect(configManager.get('key')).toBe('value')
  })

  it('key should be "get"', () => {
    expect(configManager.get('nethash')).toBe(
      '2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867',
    )
  })

  it('should build constants', () => {
    expect(configManager.constants).toEqual(network.constants)
  })

  it('should build fees', () => {
    const fees = network.constants[0].fees

    expect(feeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(fees.transfer)
    expect(feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)).toEqual(
      fees.secondSignature,
    )
    expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION)).toEqual(
      fees.delegateRegistration,
    )
    expect(feeManager.get(TRANSACTION_TYPES.VOTE)).toEqual(fees.vote)
    expect(feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)).toEqual(
      fees.multiSignature,
    )
    expect(feeManager.get(TRANSACTION_TYPES.IPFS)).toEqual(fees.ipfs)
    expect(feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)).toEqual(
      fees.timelockTransfer,
    )
    expect(feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)).toEqual(
      fees.multiPayment,
    )
    expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)).toEqual(
      fees.delegateResignation,
    )
  })

  it('should build dynamic fee offsets', () => {
    const dynamicOffsets = network.constants[0].dynamicOffsets

    expect(dynamicFeeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(
      dynamicOffsets.transfer,
    )
    expect(dynamicFeeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)).toEqual(
      dynamicOffsets.secondSignature,
    )
    expect(
      dynamicFeeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION),
    ).toEqual(dynamicOffsets.delegateRegistration)
    expect(dynamicFeeManager.get(TRANSACTION_TYPES.VOTE)).toEqual(
      dynamicOffsets.vote,
    )
    expect(dynamicFeeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)).toEqual(
      dynamicOffsets.multiSignature,
    )
    expect(dynamicFeeManager.get(TRANSACTION_TYPES.IPFS)).toEqual(
      dynamicOffsets.ipfs,
    )
    expect(dynamicFeeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)).toEqual(
      dynamicOffsets.timelockTransfer,
    )
    expect(dynamicFeeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)).toEqual(
      dynamicOffsets.multiPayment,
    )
    expect(
      dynamicFeeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION),
    ).toEqual(dynamicOffsets.delegateResignation)
  })

  it('should get constants for height', () => {
    expect(configManager.getConstants(75600)).toEqual(
      Object.assign({}, ...network.constants),
    )
  })

  it('should set the height', () => {
    configManager.setHeight(75600)

    expect(configManager.getHeight()).toEqual(75600)
  })
})
