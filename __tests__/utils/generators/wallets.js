"use strict";
exports.__esModule = true;
var crypto_1 = require("@arkecosystem/crypto");
var bip39_1 = require("bip39");
exports.generateWallets = function (network, quantity) {
    if (quantity === void 0) { quantity = 10; }
    network = network || "testnet";
    if (!["testnet", "mainnet", "devnet", "unitnet"].includes(network)) {
        throw new Error("Invalid network");
    }
    crypto_1.Managers.configManager.setFromPreset(network);
    var wallets = [];
    for (var i = 0; i < quantity; i++) {
        var passphrase = bip39_1.generateMnemonic();
        var publicKey = crypto_1.Identities.PublicKey.fromPassphrase(passphrase);
        var address = crypto_1.Identities.Address.fromPassphrase(passphrase);
        wallets.push({ address: address, passphrase: passphrase, publicKey: publicKey });
    }
    return wallets;
};
