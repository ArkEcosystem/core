const { models } = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return models.Block.deserialize(data)
}
