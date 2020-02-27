"use strict";
exports.__esModule = true;
var crypto_1 = require("@arkecosystem/crypto");
/**
 * Get the unitnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address, balance }
 */
crypto_1.Managers.configManager.setFromPreset("unitnet");
var delegates_json_1 = require("../../config/unitnet/delegates.json");
var genesisBlock_1 = require("../../config/unitnet/genesisBlock");
exports.delegates = delegates_json_1.secrets.map(function (secret) {
    var publicKey = crypto_1.Identities.PublicKey.fromPassphrase(secret);
    var address = crypto_1.Identities.Address.fromPassphrase(secret);
    var balance = genesisBlock_1.genesisBlock.transactions.find(function (transaction) { return transaction.recipientId === address && transaction.type === 0; }).amount;
    return {
        secret: secret,
        passphrase: secret,
        publicKey: publicKey,
        address: address,
        balance: balance
    };
});
