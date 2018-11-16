const { crypto } = require('@arkecosystem/crypto')
const bip39 = require('bip39')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const generateTransfer = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const app = require('./__support__/setup')

let container
let poolWalletManager

beforeAll(async () => {
  container = await app.setUp()
  poolWalletManager = new (require('../lib/pool-wallet-manager'))()
})

afterAll(async () => {
  await app.tearDown()
})

describe('applyPoolTransaction', () => {
  it('should be a function', () => {
    expect(poolWalletManager.applyPoolTransaction).toBeFunction()
  })

  describe('update the balance', () => {
    it('should update the balance of the sender & recipient', async () => {
      const delegate0 = delegates[0]
      const { publicKey } = crypto.getKeys(bip39.generateMnemonic())
      const newAddress = crypto.getAddress(publicKey)

      const delegateWallet = poolWalletManager.findByAddress(delegate0.address)
      const newWallet = poolWalletManager.findByAddress(newAddress)

      expect(+delegateWallet.balance).toBe(+delegate0.balance)
      expect(+newWallet.balance).toBe(0)

      const amount1 = 123 * 10 ** 8
      const transfer = generateTransfer(
        'testnet',
        delegate0.secret,
        newAddress,
        amount1,
        1,
      )[0]

      poolWalletManager.applyPoolTransaction(transfer)

      expect(+delegateWallet.balance).toBe(
        +delegate0.balance - amount1 - 0.1 * 10 ** 8,
      )
      expect(+newWallet.balance).toBe(amount1)
    })

    it('should update the balance of the sender & recipient with dyn fees', async () => {
      const delegate0 = delegates[1]
      const { publicKey } = crypto.getKeys(bip39.generateMnemonic())
      const newAddress = crypto.getAddress(publicKey)

      const delegateWallet = poolWalletManager.findByAddress(delegate0.address)
      const newWallet = poolWalletManager.findByAddress(newAddress)

      expect(+delegateWallet.balance).toBe(+delegate0.balance)
      expect(+newWallet.balance).toBe(0)

      const amount1 = 123 * 10 ** 8
      const fee = 10
      const transfer = generateTransfer(
        'testnet',
        delegate0.secret,
        newAddress,
        amount1,
        1,
        false,
        fee,
      )[0]

      poolWalletManager.applyPoolTransaction(transfer)

      expect(+delegateWallet.balance).toBe(+delegate0.balance - amount1 - fee)
      expect(+newWallet.balance).toBe(amount1)
    })
  })
})
