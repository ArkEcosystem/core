const {
    Transactions
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return Transactions.deserializer.deserialize(data)
}
