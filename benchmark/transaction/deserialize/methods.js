const {
    TransactionDeserializer
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return TransactionDeserializer.deserialize(data)
}
