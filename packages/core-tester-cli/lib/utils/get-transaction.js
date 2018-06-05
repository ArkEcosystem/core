const request = require('./request')

module.exports = async (id) => {
    const response = (await request.get(`/api/transactions/get?id=${id}`)).data

    if (response.success) {
        return response.transaction
    }

    return null
}
