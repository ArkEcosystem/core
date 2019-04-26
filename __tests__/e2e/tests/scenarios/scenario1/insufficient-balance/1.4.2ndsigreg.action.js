"use strict";

const { client, transactionBuilder, NetworkManager } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

/**
 * Attempt to spend with insufficient balance
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    client.setConfig(NetworkManager.findByName("testnet"));

    const transactions = [
        transactionBuilder
            .secondSignature()
            .signatureAsset(utils.secondsigRegSender2.passphrase)
            .fee(5 * Math.pow(10, 8))
            .sign(utils.secondsigRegSender.passphrase)
            .getStruct(),
    ];

    await testUtils.POST("transactions", { transactions });
};
