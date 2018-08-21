const app = require('./__support__/setup')

/**
 * Core plugins used by the testing suite.
 */
let graphql
let logger

/**
 * Hard coded queries to run, data to feed into the database
 * and expected results from the queries.
 */
const { testQueries,
        testData,
        testExpected
      } = require('./__fixtures__')

/**
 * Important elements to setUp and assign before running the tests.
 * We setup a container (see __support__/) and grant access to
 * both the GraphQL and Logger Core plugins to the suite.
 */
beforeAll(async () => {
  const container = await app.setUp()
  graphql = await container.resolvePlugin('graphql')
  logger = await container.resolvePlugin('logger')
  logger.info('Starting GraphQL Tests!')
})

/**
 * Tear down the container.
 */
afterAll(() => {
  app.tearDown()
})

/**
 * Ensure that our graphql plugin has been properly loaded
 * then run the tests.
 */
describe('GraphQL', () => {
  it('should be an object', () => {
    expect(graphql).toBeObject()
  })

  /**
   * Test queries to be performed on the test data in the database
   * and matched against expected results
   */
  describe('test queries', () => {
    it('should be an object', () => {
      expect(testQueries).toBeObject()
      logger.info('Processing test queries')
    })

    describe('test query for Block', () => {
      it('Should have queries', () => {
        expect(testQueries.block.length).toBeTruthy()

        logger.debug('Proceeding with Block test queries')

        testQueries.block.forEach((block) => {
          logger.info(`Processing Block test query with id: ${block.id}`)
        })
      })
    })

    describe('test query for Blocks', () => {
      it('Should have queries', () => {
        expect(testQueries.blocks.length).toBeTruthy()

        logger.debug('Proceeding with Blocks test queries')

        testQueries.blocks.forEach((blocks) => {
          logger.info(`Processing Blocks test query with limit: ${blocks.limit}, offset: ${blocks.offset}, orderBy: ${blocks.orderBy} and filter: ${blocks.filter}`)
        })
      })
    })

    describe('test query for Transaction', () => {
      it('should have queries', () => {
        expect(testQueries.transaction.length).toBeTruthy()

        logger.debug('Proceeding with Transaction test queries')

        testQueries.transaction.forEach((transaction) => {
          logger.info(`Processing Transaction test query with id: ${transaction.id}`)
        })
      })
    })

    describe('test query for Transactions', () => {
      it('should have queries', () => {
        expect(testQueries.transactions.length).toBeTruthy()

        logger.debug('Proceeding with Transactions test queries')

        testQueries.transactions.forEach((transactions) => {
          logger.info(`Processing Transactions test query with limit: ${transactions.limit}, orderBy: ${transactions.orderBy} and filter: ${transactions.filter}`)
        })
      })
    })

    describe('test query for Wallet', () => {
      it('should have queries', () => {
        expect(testQueries.wallet.length).toBeTruthy()

        logger.debug('Proceeding with Wallet test queries')

        testQueries.wallet.forEach((wallet) => {
          logger.info(`Processing Wallet test query with ${Object.keys(wallet)[0]}: ${wallet[Object.keys(wallet)[0]]}`)
        })
      })
    })

    describe('test query for Wallets', () => {
      it('should have queries', () => {
        expect(testQueries.wallets.length).toBeTruthy()

        logger.debug('Proceeding with Wallets test queries')

        testQueries.wallets.forEach((wallets) => {
          logger.info(`Processing Wallets test query with limit: ${wallets.limit}, orderBy: ${wallets.orderBy} and filter: ${wallets.filter}`)
        })
      })
    })
  })

  /**
   * Test data to be fed into a database and queried by test queries.
   */
  describe('test data', () => {
    it('should be an object', () => {
      expect(testData).toBeObject()
    })
  })

  /**
   * Expected results from running test queries on the test data.
   */
  describe('test expected', () => {
    it('should be an object', () => {
      expect(testExpected).toBeObject()
    })
  })
})
