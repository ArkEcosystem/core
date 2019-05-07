"use strict";

const { Managers, Transactions } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

/**
 * Create a transaction to be added to the pool and shut down the node
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    // first transaction which will be broadcasted to other nodes for forging
    let transaction = Transactions.BuilderFactory
        .transfer()
        .amount(300 * Math.pow(10, 8))
        .recipientId(utils.randomRecipient.address)
        .vendorField("transaction to add to pool before disconnecting node")
        .fee(0.1 * Math.pow(10, 8))
        .sign(utils.senderWallet.passphrase)
        .getStruct();

    await testUtils.POST("transactions", { transactions: [transaction] }, 1);

    const commandDisconnectNode = `docker network disconnect nodes $(docker ps --format "{{.Names}}" | grep node1_ark)`;
    const { stdout: stdoutDisconnect, stderr: stderrDisconnect } = await exec(commandDisconnectNode);
    console.log(`[pool-clear] disconnect node : ${JSON.stringify({ stdoutDisconnect, stderrDisconnect })}`);

    // second transaction which will not be broadcasted and should be kept in the node pool
    let transaction2 = Transactions.BuilderFactory
        .transfer()
        .amount(300 * Math.pow(10, 8))
        .recipientId(utils.randomRecipient2.address)
        .vendorField("transaction to add to pool before stopping node")
        .fee(0.1 * Math.pow(10, 8))
        .sign(utils.senderWallet.passphrase)
        .getStruct();

    await testUtils.POST("transactions", { transactions: [transaction2] }, 1);
};
