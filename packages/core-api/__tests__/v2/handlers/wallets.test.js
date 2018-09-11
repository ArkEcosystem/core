'use strict'

const app = require('../../__support__/setup')
const utils = require('../utils')

const username = 'genesis_9'
const address = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'
const publicKey = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
const balance = 245098000000000

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Wallets', () => {
  describe('GET /wallets', () => {
    it('should GET all the wallets', async () => {
      const response = await utils.request('GET', 'wallets')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectWallet(response.data.data[0])
    })
  })

  describe('GET /wallets/top', () => {
    it('should GET all the top wallets', async () => {
      const response = await utils.request('GET', 'wallets/top')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectWallet(response.data.data[0])
    })
  })

  describe('GET /wallets/:id', () => {
    it('should GET a wallet by the given identifier', async () => {
      const response = await utils.request('GET', `wallets/${address}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      const wallet = response.data.data
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
    })

    describe('when requesting an unknown address', () => {
      it('should return ResourceNotFound error', async () => {
        try {
          await utils.request('GET', 'wallets/dummy')
        } catch (error) {
          expect(error.response.status).toEqual(404)
        }
      })
    })
  })

  describe('GET /wallets/:id/transactions', () => {
    it('should GET all the transactions for the given wallet by id', async () => {
      const response = await utils.request('GET', `wallets/${address}/transactions`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectTransaction(response.data.data[0])
    })
  })

  describe('GET /wallets/:id/transactions/sent', () => {
    it('should GET all the send transactions for the given wallet by id', async () => {
      const response = await utils.request('GET', `wallets/${address}/transactions/sent`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.sender).toBe(address)
    })
  })

  describe('GET /wallets/:id/transactions/received', () => {
    it('should GET all the received transactions for the given wallet by id', async () => {
      const response = await utils.request('GET', `wallets/${address}/transactions/received`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectTransaction(response.data.data[0])
    })
  })

  describe('GET /wallets/:id/votes', () => {
    it('should GET all the votes for the given wallet by id', async () => {
      const response = await utils.request('GET', `wallets/${address}/votes`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data[0]).toBeObject()
    })
  })

  describe('POST /wallets/search', () => {
    it('should POST a search for wallets with the exact specified address', async () => {
      const response = await utils.request('POST', 'wallets/search', { address })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the exact specified publicKey', async () => {
      const response = await utils.request('POST', 'wallets/search', { address, publicKey })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
      expect(wallet.publicKey).toBe(publicKey)
    })

    // it('should POST a search for wallets with the exact specified secondPublicKey', async () => {
    //   const response = await utils.request('POST', 'wallets/search', { address: addressSecondPassphrase, secondPublicKey })
    //   utils.expectSuccessful(response)
    //   utils.expectCollection(response)

    //   expect(response.data.data).toHaveLength(1)

    //   const wallet = response.data.data[0]
    //   utils.expectWallet(wallet)
    //   expect(wallet.address).toBe(addressSecondPassphrase)
    // })

    // it('should POST a search for wallets with the exact specified vote', async () => {
    //   const response = await utils.request('POST', 'wallets/search', { address: address, vote })
    //   utils.expectSuccessful(response)
    //   utils.expectCollection(response)

    //   expect(response.data.data).toHaveLength(1)

    //   const wallet = response.data.data[0]
    //   utils.expectWallet(wallet)
    //   expect(wallet.address).toBe(address)
    // })

    it('should POST a search for wallets with the exact specified username', async () => {
      const response = await utils.request('POST', 'wallets/search', { address, username })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the exact specified balance', async () => {
      const response = await utils.request('POST', 'wallets/search', {
        address,
        balance: {
          from: balance,
          to: balance
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
      expect(wallet.balance).toBe(balance)
    })

    it('should POST a search for wallets with the specified balance range', async () => {
      const response = await utils.request('POST', 'wallets/search', {
        address,
        balance: {
          from: balance,
          to: balance
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
      expect(wallet.balance).toBe(balance)
    })

    it.skip('should POST a search for wallets with the exact specified voteBalance', async () => {
      const response = await utils.request('POST', 'wallets/search', {
        address,
        voteBalance: {
          from: 0,
          to: 0
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
    })

    it.skip('should POST a search for wallets with the specified voteBalance range', async () => {
      const response = await utils.request('POST', 'wallets/search', {
        address,
        voteBalance: {
          from: 0,
          to: 0
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
    })

    it('should POST a search for wallets with the wrong specified username', async () => {
      const response = await utils.request('POST', 'wallets/search', { address, username: 'dummy' })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(0)
    })

    it('should POST a search for wallets with the specific criteria', async () => {
      const response = await utils.request('POST', 'wallets/search', {
        publicKey, username
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const wallet = response.data.data[0]
      utils.expectWallet(wallet)
      expect(wallet.address).toBe(address)
    })
  })
})
