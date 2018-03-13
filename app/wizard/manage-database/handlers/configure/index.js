const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('app/wizard/cancel')
const utils = require('app/wizard/utils')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  const dialectResponse = await prompts(require(`./questions/${response.dialect}`), { onCancel })

  const connectionString = response.dialect === 'sqlite'
    ? `${response.dialect}://${dialectResponse.storage}`
    : `${response.dialect}://${dialectResponse.username}:${dialectResponse.password}@${dialectResponse.host}:${dialectResponse.port}/${dialectResponse.database}`

  let config = utils.readConfig('server')
  config.database.options = {
    uri: connectionString,
    dialect: response.dialect,
    logging: response.logging
  }

  return utils.writeConfig('server', config)
}
