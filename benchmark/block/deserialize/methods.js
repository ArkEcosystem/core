const {
    models
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return blocks.Block.deserialize(data)
}
