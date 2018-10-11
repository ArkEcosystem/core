'use strict'

const { client, crypto } = require('@arkecosystem/crypto')

module.exports = getDelegates()

/**
 * Get the testnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address }
 */
function getDelegates () {
    client.getConfigManager().setFromPreset('ark', 'testnet')

    const delegatesConfig = require('../../config/testnet/delegates.json')

    return delegatesConfig.secrets.map(secret => {
        const publicKey = crypto.getKeys(secret).publicKey
        return {
          secret,
          publicKey,
          address: crypto.getAddress(publicKey)
        }
    })
}
