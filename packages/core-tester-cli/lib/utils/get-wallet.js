const request = require('./request')

module.exports = async (address) => {
  let response
  try {
    response = (await request.get(`/api/v2/wallets/${address}`)).data
  } catch (error) {
    return null
  }

  if (response.data) {
    return response.data
  }

  return null
}
