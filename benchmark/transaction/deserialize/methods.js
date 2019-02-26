const {
    Transaction
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return Transaction.fromHex(data)
}
