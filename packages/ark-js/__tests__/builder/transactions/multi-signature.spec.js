import Ark from '@/'
import network from '@/networks/ark/devnet'
import feeManager from '@/managers/fee'
import { TRANSACTION_TYPES } from '@/constants'
import transactionTests from './__shared__/transaction'

let ark
let tx

beforeEach(() => {
  ark = new Ark(network)
  tx = ark.getBuilder().multiSignature()

  global.tx = tx
})

describe('Multi Signature Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('asset')
  })

  describe('create', () => {
    const keysgroup = []
    const lifetime = 'TODO'
    const min = 'TODO'

    it('establishes the multi-signature asset', () => {
      tx.create(keysgroup, lifetime, min)
      expect(tx.asset.multisignature).toEqual({ keysgroup, lifetime, min })
    })

    it('calculates and establishes the fee based on the number of key groups', () => {
      const multiSignatureFee = feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)

      tx.create(keysgroup, lifetime, min)
      expect(tx.fee).toEqual(multiSignatureFee)

      keysgroup.push('key 1')
      keysgroup.push('key 2')
      tx.create(keysgroup, lifetime, min)
      expect(tx.fee).toEqual(3 * multiSignatureFee)
    })
  })
})
