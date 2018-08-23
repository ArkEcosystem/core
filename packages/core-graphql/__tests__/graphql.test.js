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
      logger.info('Processing test queries')
    })

    describe('test query for Block', () => {
      it('should have queries', () => {
        expect(testQueries.block.length).toBeTruthy()

        logger.debug('Proceeding with Block test queries')

        testQueries.block.forEach((block) => {
          logger.info(`Processing Block test query with id: ${block.id}`)
        })
      })
    })

    describe('test query for Blocks', () => {
      it('should have queries', () => {
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
