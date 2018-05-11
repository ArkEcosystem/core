'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

const generateRound = require('./utils/generate-round')
const activeDelegates = require('../__fixtures__/delegates.json')

jest.setTimeout(60000)

beforeAll(async (done) => {
  const config = path.resolve(__dirname, './config')

  container.init({ data: '~/.ark', config }, {
    exclude: [
      '@arkecosystem/core-webhooks',
      '@arkecosystem/core-webhooks-api',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-graphql-api',
      '@arkecosystem/core-forger'
    ]
  })

  await container.plugins.registerGroup('init', {config})
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')

  await container.resolvePlugin('blockchain').start(true)

  await container.plugins.registerGroup('mounted')

  // seed
  const connection = container.resolvePlugin('database')
  await connection.buildWallets(1)
  await connection.saveWallets(true)
  await connection.saveRound(generateRound(activeDelegates, 1))

  done()
})

afterAll(async (done) => {
  await container.tearDown()

  done()
})
