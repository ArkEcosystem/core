const request = require('./request')

module.exports = async (address) => {
    const response = (await request.get(`/api/accounts/getBalance?address=${address}`)).data

    if (response.success) {
        return response.balance
    }

    return null
}
