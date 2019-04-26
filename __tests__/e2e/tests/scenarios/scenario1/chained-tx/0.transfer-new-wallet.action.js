"use strict";

const { client, transactionBuilder, NetworkManager } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");
const { delegates } = require("../../../../lib/utils/testnet");

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    client.setConfig(NetworkManager.findByName("testnet"));

    let transaction1 = transactionBuilder
        .transfer()
        .amount(1000 * Math.pow(10, 8))
        .recipientId(utils.a.address)
        .vendorField("send coins to wallet A")
        .fee(0.1 * Math.pow(10, 8))
        .sign(delegates[0].passphrase)
        .getStruct();

    await testUtils.POST("transactions", {
        transactions: [transaction1],
    });
};
