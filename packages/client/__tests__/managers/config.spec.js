import configManager from '../../lib/managers/config'
import feeManager from '../../lib/managers/fee'
import network from '../../lib/networks/ark/devnet.json'
import networkMainnet from '../../lib/networks/ark/mainnet.json'
import { TRANSACTION_TYPES } from '../../lib/constants'

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
    expect(configManager.get('nethash')).toBe('578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23')
  })

  it('should build constants', () => {
    expect(configManager.constants).toEqual(network.constants)
  })

  it('should build fees', () => {
    const fees = network.constants[0].fees

    expect(feeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(fees.transfer)
    expect(feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)).toEqual(fees.secondSignature)
    expect(feeManager.get(TRANSACTION_TYPES.DELEGATE)).toEqual(fees.delegate)
    expect(feeManager.get(TRANSACTION_TYPES.VOTE)).toEqual(fees.vote)
    expect(feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)).toEqual(fees.multiSignature)
    expect(feeManager.get(TRANSACTION_TYPES.IPFS)).toEqual(fees.ipfs)
    expect(feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)).toEqual(fees.timelockTransfer)
    expect(feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)).toEqual(fees.multiPayment)
    expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)).toEqual(fees.delegateResignation)
  })

  it('should get constants for height', () => {
    expect(configManager.getConstants(75600)).toEqual(network.constants[1])
  })

  it('should set the height', () => {
    configManager.setHeight(75600)

    expect(configManager.getHeight()).toEqual(75600)
  })
})
