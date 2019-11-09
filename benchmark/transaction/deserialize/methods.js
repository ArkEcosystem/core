const {
    Transactions
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return Transactions.Deserializer.deserialize(data)
}
