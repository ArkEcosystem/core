const prompts = require('prompts')
const questions = require('./questions')

module.exports = async (answers) => {
  const response = await prompts(questions)
  const dialectResponse = await prompts(require(`./questions/${response.dialect}`))

  const connectionString = response.dialect === 'sqlite'
    ? `${response.dialect}://${dialectResponse.storage}`
    : `${response.dialect}://${dialectResponse.username}:${dialectResponse.password}@${dialectResponse.host}:${dialectResponse.port}/${dialectResponse.database}`

  const configuration = {
    uri: connectionString,
    dialect: response.dialect,
    logging: response.logging
  }
}
