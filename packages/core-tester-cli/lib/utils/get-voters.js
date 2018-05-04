const request = require('./request')

module.exports = async (publicKey) => {
    const response = (await request.get(`/api/v1/delegates/voters?publicKey=${publicKey}`)).data

    if (response.success) {
        return response.accounts
    }

    return []
}
