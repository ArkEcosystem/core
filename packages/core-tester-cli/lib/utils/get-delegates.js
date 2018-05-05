const request = require('./request')

module.exports = async (publicKey) => {
    const response = (await request.get('/api/v1/delegates')).data

    if (response.success) {
        return response.delegates
    }

    return []
}
