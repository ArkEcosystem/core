const app = require('./__support__/setup')

let graphql

const { testData,
        testQueries,
        testExpected
      } = require('./__fixtures__')

let references = {
  data: {
    blocks: [],
    transactions: [],
    wallets: []
  },
  queries: {},
  expected: {}
}

beforeAll(async () => {
  const container = await app.setUp()
  graphql = await container.resolvePlugin('graphql')
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })

  describe('test data', () => {
    it('should be an object', () => {
      expect(testData).toBeObject()
    })

    describe('loading blocks', () => {
      references.data.blocks = testData.blocks
      expect(references.data.blocks).toBe(testData.blocks)

      it('should load transactions', () => {
        testData.transactions.forEach(transaction => {
          let blockIndex = references.data.blocks.findIndex(block => block.id === transaction.block)

          references.data.blocks[blockIndex].transactions.push(transaction)
        })
      })

      it('should now have transactions', () => {
        expect(testData.transactions).toEqual(expect.arrayContaining(references.data.blocks[0].transactions))
      })
    })
  })

  describe('test queries', () => {
    it('should be an object', () => {
      expect(testQueries).toBeObject()
    })

    describe('test query for Block', () => {
      it('should have queries', () => {
        expect(testQueries.block.length).toBeTruthy()

        testQueries.block.forEach((block) => {
        })
      })
    })

    describe('test query for Blocks', () => {
      it('should have queries', () => {
        expect(testQueries.blocks.length).toBeTruthy()

        testQueries.blocks.forEach((blocks) => {
        })
      })
    })

    describe('test query for Transaction', () => {
      it('should have queries', () => {
        expect(testQueries.transaction.length).toBeTruthy()

        testQueries.transaction.forEach((transaction) => {
        })
      })
    })

    describe('test query for Transactions', () => {
      it('should have queries', () => {
        expect(testQueries.transactions.length).toBeTruthy()

        testQueries.transactions.forEach((transactions) => {
        })
      })
    })

    describe('test query for Wallet', () => {
      it('should have queries', () => {
        expect(testQueries.wallet.length).toBeTruthy()

        testQueries.wallet.forEach((wallet) => {
        })
      })
    })

    describe('test query for Wallets', () => {
      it('should have queries', () => {
        expect(testQueries.wallets.length).toBeTruthy()

        testQueries.wallets.forEach((wallets) => {
        })
      })
    })
  })

  describe('test expected', () => {
    it('should be an object', () => {
      expect(testExpected).toBeObject()
    })
  })
})
