"use strict";
exports.__esModule = true;
var identities_1 = require("../../packages/crypto/src/identities");
var managers_1 = require("../../packages/crypto/src/managers");
managers_1.configManager.setFromPreset("testnet");
var bip39 = "this is a top secret passphrase";
var bip39Second = "this is a top secret second passphrase";
exports.identity = {
    bip39: bip39,
    address: identities_1.Address.fromPassphrase(bip39),
    publicKey: identities_1.PublicKey.fromPassphrase(bip39),
    privateKey: identities_1.PrivateKey.fromPassphrase(bip39),
    keys: identities_1.Keys.fromPassphrase(bip39),
    wif: identities_1.WIF.fromPassphrase(bip39)
};
exports.identitySecond = {
    bip39: bip39Second,
    address: identities_1.Address.fromPassphrase(bip39Second),
    publicKey: identities_1.PublicKey.fromPassphrase(bip39Second),
    privateKey: identities_1.PrivateKey.fromPassphrase(bip39Second),
    keys: identities_1.Keys.fromPassphrase(bip39Second),
    wif: identities_1.WIF.fromPassphrase(bip39Second)
};
