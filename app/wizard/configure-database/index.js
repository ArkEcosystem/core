const prompts = require('prompts')
const questions = require('./questions')

module.exports = async (answers) => {
  let response = await prompts(questions)

  const dialect = response.dialect

  response = await prompts(require(`./questions/${dialect}`))

  console.log(response)
}
