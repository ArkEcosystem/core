const request = require('./request')

module.exports = async (transactions) => {
  let response = null

  try {
    response = (await request.post('/api/v2/transactions', {transactions})).data
  } catch (error) {
    throw error
  }

  return response
}
