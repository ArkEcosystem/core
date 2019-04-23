const {
    Blocks
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return Blocks.Block.deserialize(data)
}
