'use strict'

const GenesisBlockBuilder = require('../../lib/builder/genesis-block')
const network = require('../../../core-config/lib/networks/testnet/network')

let builder
let genesis
let wallet
let delegateWallet
let delegateWallets
let delegateTransactions
const transactionAmount = 10
let transferTransaction
let delegateTransaction
let genesisBlock

beforeAll(() => {
  builder = new GenesisBlockBuilder(network, {
    totalPremine: 2100000000000000,
    activeDelegates: 3
  })
  genesis = builder.generate()
  wallet = builder.__createWallet()
  delegateWallet = builder.__createDelegateWallet('testing')
  delegateWallets = builder.__buildDelegates()
  delegateTransactions = builder.__buildDelegateTransactions(delegateWallets)

  transferTransaction = builder.__createTransferTransaction(delegateWallet, wallet, transactionAmount)
  delegateTransaction = builder.__createDelegateTransaction(delegateWallet)

  genesisBlock = builder.__createGenesisBlock({
    keys: wallet.keys,
    transactions: [...delegateTransactions, transferTransaction],
    timestamp: 0
  })
})

describe('Genesis Block Builder', () => {
  it('should be an object', async () => {
    await expect(builder).toBeInstanceOf(GenesisBlockBuilder)
  })

  describe('generate', async () => {
    it('should be a function', async () => {
      await expect(builder.generate).toBeFunction()
    })

    it('should return a genesis object', async () => {
      await expect(genesis).toContainAllKeys([
        'genesisBlock',
        'genesisWallet',
        'delegatePassphrases'
      ])
    })
  })

  describe('__createWallet', async () => {
    it('should be a function', async () => {
      await expect(builder.__createWallet).toBeFunction()
    })

    it('should return an object', async () => {
      await expect(wallet).toBeObject()
    })

    it('should return a wallet object', async () => {
      await expect(wallet).toContainAllKeys([
        'address',
        'keys',
        'passphrase'
      ])
    })

    it('should have a valid address', async () => {
      await expect(wallet.address).toEqual(expect.stringMatching(/^A/))
    })
  })

  describe('__createDelegateWallet', async () => {
    it('should be a function', async () => {
      await expect(builder.__createDelegateWallet).toBeFunction()
    })

    it('should return an object', async () => {
      await expect(delegateWallet).toBeObject()
    })

    it('should return a delegate wallet object', async () => {
      await expect(delegateWallet).toContainAllKeys([
        'address',
        'keys',
        'passphrase',
        'username'
      ])
    })

    it('should have a valid address', async () => {
      await expect(delegateWallet.address).toEqual(expect.stringMatching(/^A/))
    })

    it('should have a valid username', async () => {
      await expect(delegateWallet.username).toEqual(expect.stringMatching(/^[a-z0-9!@$&_.]+$/))
    })
  })

  describe('__buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildDelegates).toBeFunction()
    })

    it('should return an array of 3', async () => {
      await expect(delegateWallets).toBeArrayOfSize(3)
    })
  })

  describe('__buildDelegateTransactions', async () => {
    it('should be a function', async () => {
      await expect(builder.__buildDelegateTransactions).toBeFunction()
    })

    it('should return an array of 3', async () => {
      await expect(delegateTransactions).toBeArrayOfSize(3)
    })
  })

  describe('__createTransferTransaction', async () => {
    it('should be a function', async () => {
      await expect(builder.__createTransferTransaction).toBeFunction()
    })

    it('should return a transaction object', async () => {
      await expect(transferTransaction).toContainEntries([
        ['type', 0],
        ['amount', transactionAmount],
        ['fee', 0],
        ['recipientId', wallet.address]
      ])
    })
  })
})
