'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const username = 'genesis_9'
const address = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'
const publicKey = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
const balance = 245098000000000

describe('API 2.0 - Wallets', () => {
  describe('GET /wallets', () => {
    it('should GET all the wallets', async () => {
      const res = await utils.request('GET', 'wallets')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertWallet(res.body.data[0])
    })
  })

  describe('GET /wallets/top', () => {
    it('should GET all the top wallets', async () => {
      const res = await utils.request('GET', 'wallets/top')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertWallet(res.body.data[0])
    })
  })

  describe('GET /wallets/:id', () => {
    it('should GET a wallet by the given identifier', async () => {
      const res = await utils.request('GET', `wallets/${address}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      const wallet = res.body.data
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })

    it('should return ResourceNotFound error', async () => {
      try {
        await utils.request('GET', `wallets/dummy`)
      } catch (error) {
        await expect(error.message).toEqual('Not Found')
      }
    })
  })

  describe('GET /wallets/:id/transactions', () => {
    it('should GET all the transactions for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${address}/transactions`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertTransaction(res.body.data[0])
    })
  })

  describe('GET /wallets/:id/transactions/sent', () => {
    it('should GET all the send transactions for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${address}/transactions/sent`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.sender).toBe(address)
    })
  })

  describe('GET /wallets/:id/transactions/received', () => {
    it('should GET all the received transactions for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${address}/transactions/received`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertTransaction(res.body.data[0])
    })
  })

  describe('GET /wallets/:id/votes', () => {
    it('should GET all the votes for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${address}/votes`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data[0]).toBeObject()
    })
  })

  describe('POST /wallets/search', () => {
    it('should POST a search for wallets with the exact specified address', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: address })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the exact specified publicKey', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: address, publicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
      await expect(wallet.publicKey).toBe(publicKey)
    })

    it.skip('should POST a search for wallets with the exact specified secondPublicKey', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressSecondPassphrase, secondPublicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressSecondPassphrase)
    })

    it.skip('should POST a search for wallets with the exact specified vote', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: address, vote })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the exact specified username', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: address, username })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the exact specified balance', async () => {
      const res = await utils.request('POST', 'wallets/search', {
        address,
        balance: {
          from: balance,
          to: balance
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
      await expect(wallet.balance).toBe(balance)
    })

    it('should POST a search for wallets with the specified balance range', async () => {
      const res = await utils.request('POST', 'wallets/search', {
        address,
        balance: {
          from: balance,
          to: balance
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
      await expect(wallet.balance).toBe(balance)
    })

    it('should POST a search for wallets with the exact specified votebalance', async () => {
      const res = await utils.request('POST', 'wallets/search', {
        address: address,
        votebalance: {
          from: 0,
          to: 0
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the specified votebalance range', async () => {
      const res = await utils.request('POST', 'wallets/search', {
        address: address,
        votebalance: {
          from: 0,
          to: 0
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the wrong specified username', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: address, username: 'dummy' })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(0)
    })

    it('should POST a search for wallets with the specific criteria', async () => {
      const res = await utils.request('POST', 'wallets/search', {
        publicKey, username
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
    })
  })
})
