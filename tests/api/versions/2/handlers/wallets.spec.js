const utils = require('../utils')

const addressActive = 'DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN'
const addressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'
const addressSecondPassphrase = 'DR23FuR1M9GPaknEFSP6QCbsaHnTMdgkFu'
const publicKey = '022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d'
const secondPublicKey = '027c0dc4da12a3842981d37240a4da48eea435299191609d5f446176ff18024df6'
const vote = '0257b7724e97cd832e0c28533a86da5220656f9b5122141daab20e8526decce01f'
const username = 'boldninja'
const wrongUsername = 'alexbarnsley'
const votebalance = 0
const votebalanceFrom = -1
const votebalanceTo = 1

describe('API 2.0 - Wallets', () => {
  describe('GET /api/wallets', () => {
    it('should GET all the wallets', async () => {
      const res = await utils.request('GET', 'wallets')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertWallet(res.body.data[1])
    })
  })

  describe('GET /api/wallets/top', () => {
    it('should GET all the top wallets', async () => {
      const res = await utils.request('GET', 'wallets/top')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertWallet(res.body.data[0])
    })
  })

  describe('GET /api/wallets/:id', () => {
    it('should GET a wallet by the given identifier', async () => {
      const res = await utils.request('GET', `wallets/${addressActive}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      const wallet = res.body.data
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
    })

    it('should return ResourceNotFound error', async () => {
      try {
        await utils.request('GET', `wallets/${addressCold}`)
      } catch (error) {
        await expect(error.message).toEqual('Not Found')
      }
    })
  })

  describe('GET /api/wallets/:id/transactions', () => {
    it('should GET all the transactions for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${addressActive}/transactions`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertTransaction(res.body.data[0])
    })
  })

  describe('GET /api/wallets/:id/transactions/send', () => {
    it('should GET all the send transactions for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${addressActive}/transactions/send`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.sender).toBe(addressActive)
    })
  })

  describe('GET /api/wallets/:id/transactions/received', () => {
    it('should GET all the received transactions for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${addressActive}/transactions/received`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertTransaction(res.body.data[0])
    })
  })

  describe('GET /api/wallets/:id/votes', () => {
    it('should GET all the votes for the given wallet by id', async () => {
      const res = await utils.request('GET', `wallets/${addressActive}/votes`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const vote = res.body.data[0]
      await expect(vote.id).toBeType('string')
      await expect(vote.type).toBeType('number')
      await expect(vote.amount).toBeType('number')
      await expect(vote.fee).toBeType('number')
      await expect(vote.sender).toBe(addressActive)
      await expect(vote.recipient).toBeType('string')
      await expect(vote.signature).toBeType('string')
      await expect(vote.asset).toBeType('object')
      await expect(vote.asset.votes).toBeType('array')
    })
  })

  describe('POST /api/wallets/search', () => {
    it('should POST a search for wallets with the exact specified address', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressActive })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
    })

    it('should POST a search for wallets with the exact specified publicKey', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressActive, publicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
      await expect(wallet.publicKey).toBe(publicKey)
    })

    it('should POST a search for wallets with the exact specified secondPublicKey', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressSecondPassphrase, secondPublicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressSecondPassphrase)
    })

    it('should POST a search for wallets with the exact specified vote', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressActive, vote })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
    })

    it('should POST a search for wallets with the exact specified username', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressActive, username })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
    })

    it('should POST a search for wallets with the exact specified balance', async () => {
      const address = 'DDgKyKqdA6SuamB1eW77WvFu6RQFMZoU36'
      const balance = 4858470000000

      const res = await utils.request('POST', 'wallets/search', { address, balance })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(address)
      await expect(wallet.balance).toBe(balance)
    })

    it('should POST a search for wallets with the specified balance range', async () => {
      const address = 'DDgKyKqdA6SuamB1eW77WvFu6RQFMZoU36'
      const balance = 4858470000000
      const balanceFrom = 4858460000000
      const balanceTo = 4858480000000

      const res = await utils.request('POST', 'wallets/search', {
        address,
        balance: {
          from: balanceFrom,
          to: balanceTo
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
      const res = await utils.request('POST', 'wallets/search', { address: addressActive, votebalance })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
    })

    it('should POST a search for wallets with the specified votebalance range', async () => {
      const res = await utils.request('POST', 'wallets/search', {
        address: addressActive,
        votebalance: {
          from: votebalanceFrom,
          to: votebalanceTo
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const wallet = res.body.data[0]
      await utils.assertWallet(wallet)
      await expect(wallet.address).toBe(addressActive)
    })

    it('should POST a search for wallets with the wrong specified username', async () => {
      const res = await utils.request('POST', 'wallets/search', { address: addressActive, username: wrongUsername })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(0)
    })

    it('should POST a search for wallets with the specific criteria', async () => {
      const address = 'DDgKyKqdA6SuamB1eW77WvFu6RQFMZoU36'
      const publicKey = '0223ac52179903e79865b9a98cf0b52ddc1ab46180c157e8f6bd1e63e7f14fcf31'
      const username = 'genesis_48'
      const balanceFrom = 4858470000000
      const balanceTo = 4858470000000

      const res = await utils.request('POST', 'wallets/search', {
        publicKey, username, balanceFrom, balanceTo
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
