const request = require('./request')

module.exports = async (address) => {
    const response = (await request.get(`/api/accounts?address=${address}`)).data

    if (response.success) {
        return response.account
    }

    return null
}
