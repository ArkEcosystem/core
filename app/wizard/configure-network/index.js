const prompts = require('prompts')
const questions = require('./questions')

module.exports = async () => prompts(questions, { onCancel: () => process.exit() })
