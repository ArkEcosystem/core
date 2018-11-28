const GenesisBlockBuilder = require('../../lib/builder/genesis-block')
const network = require('../../../crypto/lib/networks/ark/testnet')

let builder
let genesis
let wallet
let delegateWallet
let delegateWallets

beforeEach(() => {
  builder = new GenesisBlockBuilder(network, {
    totalPremine: 2100000000000000,
    activeDelegates: 2,
  })

  delegateWallets = builder.__buildDelegates()
})

describe('Genesis Block Builder', () => {
  it('should be an object', () => {
    expect(builder).toBeInstanceOf(GenesisBlockBuilder)
  })

  describe('generate', () => {
    it('should be a function', () => {
      expect(builder.generate).toBeFunction()
    })

    it('should return a genesis object', () => {
      genesis = builder.generate()

      expect(genesis).toContainAllKeys([
        'genesisBlock',
        'genesisWallet',
        'delegatePassphrases',
      ])
    })

    it('should call the expected methods', () => {
      builder.__createWallet = jest.fn(builder.__createWallet)
      builder.__buildDelegates = jest.fn(builder.__buildDelegates)
      builder.__buildDelegateTransactions = jest.fn(
        builder.__buildDelegateTransactions,
      )
      builder.__createTransferTransaction = jest.fn(
        builder.__createTransferTransaction,
      )
      builder.__createGenesisBlock = jest.fn(builder.__createGenesisBlock)

      builder.generate()

      expect(builder.__createWallet).toHaveBeenCalledTimes(4)
      expect(builder.__buildDelegates).toHaveBeenCalledTimes(1)
      expect(builder.__buildDelegateTransactions).toHaveBeenCalledTimes(1)
      expect(builder.__createTransferTransaction).toHaveBeenCalledTimes(1)
      expect(builder.__createGenesisBlock).toHaveBeenCalledTimes(1)
    })
  })

  describe('__createWallet', () => {
    it('should be a function', () => {
      expect(builder.__createWallet).toBeFunction()
    })

    it('should return an object', () => {
      wallet = builder.__createWallet()

      expect(wallet).toBeObject()
    })

    it('should return a wallet object', () => {
      expect(wallet).toContainAllKeys(['address', 'keys', 'passphrase'])
    })

    it('should have a valid address', () => {
      expect(wallet.address).toEqual(expect.stringMatching(/^A/))
    })
  })

  describe('__createDelegateWallet', () => {
    it('should be a function', () => {
      expect(builder.__createDelegateWallet).toBeFunction()
    })

    it('should return an object', () => {
      delegateWallet = builder.__createDelegateWallet('testing')

      expect(delegateWallet).toBeObject()
    })

    it('should return a delegate wallet object', () => {
      expect(delegateWallet).toContainAllKeys([
        'address',
        'keys',
        'passphrase',
        'username',
      ])
    })

    it('should have a valid address', () => {
      expect(delegateWallet.address).toEqual(expect.stringMatching(/^A/))
    })

    it('should have a valid username', () => {
      expect(delegateWallet.username).toEqual(
        expect.stringMatching(/^[a-z0-9!@$&_.]+$/),
      )
    })

    it('should call the expected methods', () => {
      builder.__createWallet = jest.fn(builder.__createWallet)

      builder.__createDelegateWallet('testing')

      expect(builder.__createWallet).toHaveBeenCalledTimes(1)
    })
  })

  describe('__buildDelegates', () => {
    it('should be a function', () => {
      expect(builder.__buildDelegates).toBeFunction()
    })

    it('should return an array of 2', () => {
      expect(delegateWallets).toBeArrayOfSize(2)
    })

    it('should call the expected methods', () => {
      builder.__createDelegateWallet = jest.fn(builder.__createDelegateWallet)

      builder.__buildDelegates('testing')

      expect(builder.__createDelegateWallet).toHaveBeenCalledTimes(2)
    })
  })

  describe('__buildDelegateTransactions', () => {
    it('should be a function', () => {
      expect(builder.__buildDelegateTransactions).toBeFunction()
    })

    it('should return an array of 2', () => {
      const delegateTransactions = builder.__buildDelegateTransactions(
        delegateWallets,
      )

      expect(delegateTransactions).toBeArrayOfSize(2)
    })

    it('should call the expected methods', () => {
      builder.__createDelegateTransaction = jest.fn(
        builder.__createDelegateTransaction,
      )

      builder.__buildDelegateTransactions(delegateWallets)

      expect(builder.__createDelegateTransaction).toHaveBeenCalledTimes(2)
    })
  })

  describe('__createTransferTransaction', () => {
    it('should be a function', () => {
      expect(builder.__createTransferTransaction).toBeFunction()
    })

    it('should return a transaction object', () => {
      const transferTransaction = builder.__createTransferTransaction(
        delegateWallet,
        wallet,
        10,
      )

      expect(transferTransaction).toContainEntries([
        ['type', 0],
        ['amount', 10],
        ['fee', 0],
        ['recipientId', wallet.address],
      ])
    })

    it('should call the expected methods', () => {
      builder.__formatGenesisTransaction = jest.fn(
        builder.__formatGenesisTransaction,
      )

      builder.__createTransferTransaction(delegateWallet, wallet, 10)

      expect(builder.__formatGenesisTransaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('__createDelegateTransaction', () => {
    it('should be a function', () => {
      expect(builder.__createDelegateTransaction).toBeFunction()
    })

    it('should return a transaction object', () => {
      const delegateTransaction = builder.__createDelegateTransaction(
        delegateWallet,
      )

      expect(delegateTransaction).toContainEntries([
        ['type', 2],
        ['amount', 0],
        ['fee', 0],
        ['senderId', delegateWallet.address],
      ])

      expect(delegateTransaction.asset.delegate).toHaveProperty(
        'username',
        delegateWallet.username,
      )
      expect(delegateTransaction.asset.delegate).toHaveProperty(
        'publicKey',
        delegateWallet.keys.publicKey,
      )
    })

    it('should call the expected methods', () => {
      builder.__formatGenesisTransaction = jest.fn(
        builder.__formatGenesisTransaction,
      )

      builder.__createDelegateTransaction(delegateWallet)

      expect(builder.__formatGenesisTransaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('__createGenesisBlock', () => {
    it('should be a function', () => {
      expect(builder.__createGenesisBlock).toBeFunction()
    })

    it('should match the expected struct', () => {
      const genesisBlock = builder.__createGenesisBlock({
        keys: wallet.keys,
        transactions: [],
        timestamp: 0,
      })

      expect(genesisBlock).toContainAllKeys([
        'id',
        'blockSignature',
        'version',
        'totalAmount',
        'totalFee',
        'reward',
        'payloadHash',
        'timestamp',
        'numberOfTransactions',
        'payloadLength',
        'previousBlock',
        'generatorPublicKey',
        'transactions',
        'height',
      ])
    })

    it('should call the expected methods', () => {
      builder.__getBlockId = jest.fn()
      builder.__signBlock = jest.fn()

      builder.__createGenesisBlock({
        keys: wallet.keys,
        transactions: [],
        timestamp: 0,
      })

      expect(builder.__getBlockId).toHaveBeenCalledTimes(1)
      expect(builder.__signBlock).toHaveBeenCalledTimes(1)
    })
  })
})
