const request = require('./request')

module.exports = async (id) => {
  const response = (await request.get(`/api/v2/transactions/${id}`)).data

  if (response.data) {
      return response.data
  }

  return null
}
