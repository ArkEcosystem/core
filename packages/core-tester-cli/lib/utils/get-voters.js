const paginate = require('./paginate')

module.exports = async (publicKey) => {
  try {
    const voters = await paginate(`/api/v2/delegates/${publicKey}/voters`)

    return voters
  } catch (error) {
  }

  return []
}
