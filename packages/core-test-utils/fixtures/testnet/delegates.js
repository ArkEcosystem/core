'use strict'

const { crypto } = require('@arkecosystem/crypto')

module.exports = getDelegates()

function getDelegates () {
    const delegates = require('../../config/testnet/delegates.json')
    delegates.publicKeys = delegates.secrets.map(secret => crypto.getKeys(secret).publicKey)
    return delegates
}
