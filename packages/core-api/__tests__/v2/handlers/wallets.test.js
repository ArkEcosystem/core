'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
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
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the wallets', async () => {
        const response = await utils[request]('GET', 'wallets')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectWallet(response.data.data[0])
      })
    })
  })

  describe('GET /wallets/top', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the top wallets', async () => {
        const response = await utils[request]('GET', 'wallets/top')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectWallet(response.data.data[0])
      })
    })
  })

  describe('GET /wallets/:id', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET a wallet by the given identifier', async () => {
        const response = await utils[request]('GET', `wallets/${address}`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        const wallet = response.data.data
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
      })
    })

    describe('when requesting an unknown address', () => {
      describe.each([
        ['API-Version', 'request'],
        ['Accept', 'requestWithAcceptHeader']
      ])('using the %s header', (header, request) => {
        it('should return ResourceNotFound error', async () => {
          try {
            await utils[request]('GET', 'wallets/dummy')
          } catch (error) {
            expect(error.response.status).toEqual(404)
          }
        })
      })
    })
  })

  describe('GET /wallets/:id/transactions', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the transactions for the given wallet by id', async () => {
        const response = await utils[request]('GET', `wallets/${address}/transactions`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectTransaction(response.data.data[0])
      })
    })
  })

  describe('GET /wallets/:id/transactions/sent', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the send transactions for the given wallet by id', async () => {
        const response = await utils[request]('GET', `wallets/${address}/transactions/sent`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.sender).toBe(address)
      })
    })
  })

  describe('GET /wallets/:id/transactions/received', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the received transactions for the given wallet by id', async () => {
        const response = await utils[request]('GET', `wallets/${address}/transactions/received`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectTransaction(response.data.data[0])
      })
    })
  })

  describe('GET /wallets/:id/votes', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the votes for the given wallet by id', async () => {
        const response = await utils[request]('GET', `wallets/${address}/votes`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data[0]).toBeObject()
      })
    })
  })

  describe('POST /wallets/search', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the exact specified address', async () => {
        const response = await utils[request]('POST', 'wallets/search', { address })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the exact specified publicKey', async () => {
        const response = await utils[request]('POST', 'wallets/search', { address, publicKey })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
        expect(wallet.publicKey).toBe(publicKey)
      })
    })

    // describe.each([
    //   ['API-Version', 'request'],
    //   ['Accept', 'requestWithAcceptHeader']
    // ])('using the %s header', (header, request) => {
    //   it('should POST a search for wallets with the exact specified secondPublicKey', async () => {
    //     const response = await utils[request]('POST', 'wallets/search', { address: addressSecondPassphrase, secondPublicKey })
    //     expect(response).toBeSuccessfulResponse()
    //     expect(response.data.data).toBeArray()

    //     expect(response.data.data).toHaveLength(1)

    //     const wallet = response.data.data[0]
    //     utils.expectWallet(wallet)
    //     expect(wallet.address).toBe(addressSecondPassphrase)
    //   })
    // })

    // describe.each([
    //   ['API-Version', 'request'],
    //   ['Accept', 'requestWithAcceptHeader']
    // ])('using the %s header', (header, request) => {
    //   it('should POST a search for wallets with the exact specified vote', async () => {
    //     const response = await utils[request]('POST', 'wallets/search', { address: address, vote })
    //     expect(response).toBeSuccessfulResponse()
    //     expect(response.data.data).toBeArray()

    //     expect(response.data.data).toHaveLength(1)

    //     const wallet = response.data.data[0]
    //     utils.expectWallet(wallet)
    //     expect(wallet.address).toBe(address)
    //   })
    // })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the exact specified username', async () => {
        const response = await utils[request]('POST', 'wallets/search', { address, username })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the exact specified balance', async () => {
        const response = await utils[request]('POST', 'wallets/search', {
          address,
          balance: {
            from: balance,
            to: balance
          }
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
        expect(wallet.balance).toBe(balance)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the specified balance range', async () => {
        const response = await utils[request]('POST', 'wallets/search', {
          address,
          balance: {
            from: balance,
            to: balance
          }
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
        expect(wallet.balance).toBe(balance)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it.skip('should POST a search for wallets with the exact specified voteBalance', async () => {
        const response = await utils[request]('POST', 'wallets/search', {
          address,
          voteBalance: {
            from: 0,
            to: 0
          }
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it.skip('should POST a search for wallets with the specified voteBalance range', async () => {
        const response = await utils[request]('POST', 'wallets/search', {
          address,
          voteBalance: {
            from: 0,
            to: 0
          }
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the wrong specified username', async () => {
        const response = await utils[request]('POST', 'wallets/search', { address, username: 'dummy' })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(0)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for wallets with the specific criteria', async () => {
        const response = await utils[request]('POST', 'wallets/search', {
          publicKey, username
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const wallet = response.data.data[0]
        utils.expectWallet(wallet)
        expect(wallet.address).toBe(address)
      })
    })
  })
})
