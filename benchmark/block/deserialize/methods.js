const {
    Blocks
} = require('@arkecosystem/crypto')

exports.deserialize = data => {
    return Blocks.Deserializer.deserialize(data)
}
