'use strict'

const GenesisBlockBuilder = require('../../lib/builder/genesis-block')
const network = require('../../../core-config/lib/networks/testnet/network')

let builder
let genesis

beforeAll(() => {
    builder = new GenesisBlockBuilder(network, {
      totalPremine: 2100000000000000,
      activeDelegates: 51
    })
    genesis = builder.generate()
})

describe('Genesis Block Builder', () => {
  it('should be an object', async () => {
    await expect(builder).toBeInstanceOf(GenesisBlockBuilder)
  })

  describe('generate', async () => {
    it('should be a function', async () => {
      await expect(builder.generate).toBeFunction()
    })

    it('should return a genesis block', async () => {
      await expect(genesis).toHaveProperty('genesisBlock')
    })

    it('should return a genesis wallet', async () => {
      await expect(genesis).toHaveProperty('genesisWallet')
    })

    it('should return delegate passphrases', async () => {
      await expect(genesis).toHaveProperty(['delegatePassphrases'])
    })
  })
})
