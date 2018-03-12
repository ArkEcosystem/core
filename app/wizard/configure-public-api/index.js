const prompts = require('prompts')
const questions = require('./questions')

module.exports = async (answers) => {
  const response = await prompts(questions)

  if (response.cache) {
    const cacheResponse = await prompts(require('./questions/cache'))
  }

  if (response.rateLimit) {
    const rateLimitResponse = await prompts(require('./questions/rate-limit'))
  }
}
