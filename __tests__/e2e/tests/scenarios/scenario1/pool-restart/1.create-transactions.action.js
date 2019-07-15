"use strict";

const { Managers, Identities } = require("@arkecosystem/crypto");
const utils = require("./utils");
const testUtils = require("../../../../lib/utils/test-utils");

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { TransactionFactory } = require('../../../../../helpers/transaction-factory');

/**
 * Create a transaction to be added to the pool and shut down the node
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async options => {
    Managers.configManager.setFromPreset("testnet");

    const nonce = nonce = TransactionFactory.getNonce(Identities.PublicKey.fromPassphrase(utils.senderWallet.passphrase));

    // first transaction which will be broadcasted to other nodes for forging
    let transaction = TransactionFactory.transfer(utils.randomRecipient.address, 300 * Math.pow(10, 8), "transaction to add to pool before disconnecting node")
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(utils.senderWallet.passphrase)
        .withNonce(nonce.plus(1))
        .createOne();

    await testUtils.POST("transactions", { transactions: [transaction] }, 1);

    const commandDisconnectNode = `docker network disconnect nodes $(docker ps --format "{{.Names}}" | grep node1_ark)`;
    const { stdout: stdoutDisconnect, stderr: stderrDisconnect } = await exec(commandDisconnectNode);
    console.log(`[pool-clear] disconnect node : ${JSON.stringify({ stdoutDisconnect, stderrDisconnect })}`);

    // second transaction which will not be broadcasted and should be kept in the node pool
    let transaction = TransactionFactory.transfer(utils.randomRecipient2.address, 300 * Math.pow(10, 8), "transaction to add to pool before stopping node")
        .withFee(0.1 * Math.pow(10, 8))
        .withPassphrase(utils.senderWallet.passphrase)
        .withNonce(nonce.plus(2))
        .createOne();


    await testUtils.POST("transactions", { transactions: [transaction2] }, 1);
};
