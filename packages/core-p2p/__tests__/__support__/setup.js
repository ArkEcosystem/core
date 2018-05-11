'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  const config = path.resolve(__dirname, './config')

  container.init({ data: '~/.ark', config })

  await container.plugins.registerGroup('init', {config})
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')
  await container.resolvePlugin('blockchain').start()
}

exports.tearDown = async () => container.tearDown()
