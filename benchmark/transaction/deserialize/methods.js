const {
    models
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return models.Transaction.deserialize(data)
}
