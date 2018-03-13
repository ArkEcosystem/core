const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('../cancel')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  if (response.cache) {
    const cacheResponse = await prompts(require('./questions/cache'), { onCancel })
  }

  if (response.rateLimit) {
    const rateLimitResponse = await prompts(require('./questions/rate-limit'), { onCancel })
  }
}
