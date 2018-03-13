const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('../../../cancel')
const config = require(`config/${process.env.NETWORK}/server.json`)

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  const dialectResponse = await prompts(require(`./questions/${response.dialect}`), { onCancel })

  const connectionString = response.dialect === 'sqlite'
    ? `${response.dialect}://${dialectResponse.storage}`
    : `${response.dialect}://${dialectResponse.username}:${dialectResponse.password}@${dialectResponse.host}:${dialectResponse.port}/${dialectResponse.database}`

  config.database.options = {
    uri: connectionString,
    dialect: response.dialect,
    logging: response.logging
  }
}
