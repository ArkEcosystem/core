'use strict';

const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('../../../utils')

module.exports = async () => {
  const response = await prompts(questions, { onCancel })

  const dialectResponse = await prompts(require(`./questions/${response.dialect}`), { onCancel })

  const connectionString = response.dialect === 'sqlite'
    ? `${response.dialect}://${dialectResponse.storage}`
    : `${response.dialect}://${dialectResponse.username}:${dialectResponse.password}@${dialectResponse.host}:${dialectResponse.port}/${dialectResponse.database}`

  let config = readConfig('server')
  config.database.options = {
    uri: connectionString,
    dialect: response.dialect,
    logging: response.logging
  }

  return writeConfig('server', config)
}
