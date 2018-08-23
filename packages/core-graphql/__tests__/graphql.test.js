const app = require('./__support__/setup')

let graphql

const { testQueries,
        testData,
        testExpected
      } = require('./__fixtures__')

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

  describe('test queries', () => {
    it('should be an object', () => {
      expect(testQueries).toBeObject()
    })

    describe('test query for Block', () => {
      it('should have queries', () => {
        expect(testQueries.block.length).toBeTruthy()

        logger.debug('Proceeding with Block test queries')

        testQueries.block.forEach((block) => {
        })
      })
    })

    describe('test query for Blocks', () => {
      it('should have queries', () => {
        expect(testQueries.blocks.length).toBeTruthy()

        logger.debug('Proceeding with Blocks test queries')

        testQueries.blocks.forEach((blocks) => {
        })
      })
    })

    describe('test query for Transaction', () => {
      it('should have queries', () => {
        expect(testQueries.transaction.length).toBeTruthy()

        logger.debug('Proceeding with Transaction test queries')

        testQueries.transaction.forEach((transaction) => {
        })
      })
    })

    describe('test query for Transactions', () => {
      it('should have queries', () => {
        expect(testQueries.transactions.length).toBeTruthy()

        logger.debug('Proceeding with Transactions test queries')

        testQueries.transactions.forEach((transactions) => {
        })
      })
    })

    describe('test query for Wallet', () => {
      it('should have queries', () => {
        expect(testQueries.wallet.length).toBeTruthy()

        logger.debug('Proceeding with Wallet test queries')

        testQueries.wallet.forEach((wallet) => {
        })
      })
    })

    describe('test query for Wallets', () => {
      it('should have queries', () => {
        expect(testQueries.wallets.length).toBeTruthy()

        logger.debug('Proceeding with Wallets test queries')

        testQueries.wallets.forEach((wallets) => {
        })
      })
    })
  })

  describe('test data', () => {
    it('should be an object', () => {
      expect(testData).toBeObject()
    })
  })

  describe('test expected', () => {
    it('should be an object', () => {
      expect(testExpected).toBeObject()
    })
  })
})
