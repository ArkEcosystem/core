const { crypto } = require('@arkecosystem/crypto')
const { Block } = require('@arkecosystem/crypto').models
const bip39 = require('bip39')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const generateTransfer = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const generateWallets = require('@arkecosystem/core-test-utils/lib/generators/wallets')
const blocks2to100 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.2-100')
const app = require('./__support__/setup')

const arktoshi = 10 ** 8
let container
let poolWalletManager
let blockchain

beforeAll(async () => {
  container = await app.setUp()
  poolWalletManager = new (require('../lib/pool-wallet-manager'))()
  blockchain = container.resolvePlugin('blockchain')
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

    it('should apply chained transfers involving cold wallets - and update balances', async () => {
      const delegate = delegates[7]
      const delegateWallet = poolWalletManager.findByPublicKey(
        delegate.publicKey,
      )

      const wallets = generateWallets('testnet', 4)
      const poolWallets = wallets.map(w =>
        poolWalletManager.findByAddress(w.address),
      )

      expect(+delegateWallet.balance).toBe(+delegate.balance)
      poolWallets.forEach(w => {
        expect(+w.balance).toBe(0)
      })

      const transfers = [
        {
          // transfer from delegate to wallet 0
          from: delegate,
          to: wallets[0],
          amount: 100 * arktoshi,
        },
        {
          // transfer from wallet 0 to wallet 1
          from: wallets[0],
          to: wallets[1],
          amount: 55 * arktoshi,
        },
        {
          // transfer from wallet 1 to wallet 2
          from: wallets[1],
          to: wallets[2],
          amount: 40 * arktoshi,
        },
        {
          // transfer from wallet 2 to delegate
          from: wallets[2],
          to: delegate,
          amount: 15 * arktoshi,
        },
        {
          // transfer from delegate to wallet 1
          from: delegate,
          to: wallets[1],
          amount: 33 * arktoshi,
        },
        {
          // transfer from delegate to wallet 3
          from: delegate,
          to: wallets[3],
          amount: 17 * arktoshi,
        },
      ]

      transfers.forEach(t => {
        const transfer = generateTransfer(
          'testnet',
          t.from.passphrase,
          t.to.address,
          t.amount,
          1,
        )[0]

        const fromWallet = poolWalletManager.findByAddress(t.from.address)
        const fromBalanceBefore = +fromWallet.balance
        const toWallet = poolWalletManager.findByAddress(t.to.address)
        const toBalanceBefore = +toWallet.balance

        poolWalletManager.applyPoolTransaction(transfer)

        expect(+fromWallet.balance).toBe(
          fromBalanceBefore - t.amount - 0.1 * arktoshi,
        )
        expect(+toWallet.balance).toBe(toBalanceBefore + t.amount)
      })

      // check final balances
      expect(+delegateWallet.balance).toBe(
        delegate.balance + (-100 + 15 - 33 - 17 - 3 * 0.1) * arktoshi,
      )
      expect(+poolWallets[0].balance).toBe((100 - 55 - 0.1) * arktoshi)
      expect(+poolWallets[1].balance).toBe((55 - 40 - 0.1 + 33) * arktoshi)
      expect(+poolWallets[2].balance).toBe((40 - 15 - 0.1) * arktoshi)
      expect(+poolWallets[3].balance).toBe(17 * arktoshi)
    })
  })
})

describe('Apply transactions and block rewards to wallets on new block', () => {
  const __resetToHeight1 = async () =>
    blockchain.removeBlocks(blockchain.getLastHeight() - 1)

  beforeEach(__resetToHeight1)
  afterEach(__resetToHeight1)

  it.each([2 * arktoshi, 0])(
    'should apply forged block reward %i to delegate wallet',
    async reward => {
      const forgingDelegate = delegates[reward ? 2 : 3] // use different delegate to have clean initial balance
      const generatorPublicKey = forgingDelegate.publicKey

      const wallet = generateWallets('testnet', 1)[0]
      const transferAmount = 1234
      const transferDelegate = delegates[4]
      const transfer = generateTransfer(
        'testnet',
        transferDelegate.passphrase,
        wallet.address,
        transferAmount,
        1,
        true,
      )[0]

      const totalFee = 0.1 * arktoshi
      const blockWithReward = Object.assign({}, blocks2to100[0], {
        reward,
        generatorPublicKey,
        transactions: [transfer],
        numberOfTransactions: 1,
        totalFee,
      })
      const blockWithRewardVerified = new Block(blockWithReward)
      blockWithRewardVerified.verification.verified = true

      await blockchain.processBlock(blockWithRewardVerified, () => null)

      const delegateWallet = poolWalletManager.findByPublicKey(
        generatorPublicKey,
      )

      const poolWallet = poolWalletManager.findByAddress(wallet.address)
      expect(+poolWallet.balance).toBe(transferAmount)

      const transferDelegateWallet = poolWalletManager.findByAddress(
        transferDelegate.address,
      )
      expect(+transferDelegateWallet.balance).toBe(
        +transferDelegate.balance - transferAmount - totalFee,
      )

      expect(+delegateWallet.balance).toBe(
        +forgingDelegate.balance + reward + totalFee,
      ) // balance increased by reward + fee
    },
  )
})
