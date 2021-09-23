"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = require("assert");
const logger_1 = require("../services/logger");
const network_1 = require("../services/network");
const buildTransaction = async (transactionType, transactionBuilder, params, method) => {
    if (params.fee) {
        transactionBuilder.fee(params.fee);
    }
    else {
        // Get the average fee from the network
        try {
            const { data } = await network_1.network.sendGET({
                path: "node/fees",
                query: { days: 30 },
            });
            const fee = data[1][transactionType].avg;
            if (fee && Number(fee) > 0) {
                transactionBuilder.fee(fee);
            }
        }
        catch (error) {
            logger_1.logger.warn("Failed to retrieve the average fee.");
        }
    }
    const milestone = crypto_1.Managers.configManager.getMilestone(await network_1.network.getHeight());
    if (milestone.aip11) {
        // If AIP11 is enabled, get the nonce of the sender wallet
        const senderAddress = method === "sign"
            ? crypto_1.Identities.Address.fromPassphrase(params.passphrase)
            : crypto_1.Identities.Address.fromPublicKey(crypto_1.Identities.PublicKey.fromWIF(params.passphrase));
        try {
            const { data } = await network_1.network.sendGET({
                path: `wallets/${senderAddress}`,
            });
            assert_1.notStrictEqual(data.nonce, undefined);
            transactionBuilder.nonce(crypto_1.Utils.BigNumber.make(data.nonce)
                .plus(1)
                .toFixed());
        }
        catch (error) {
            throw new Error(`Failed to retrieve the nonce for ${senderAddress}.`);
        }
    }
    const transaction = transactionBuilder[method](params.passphrase).getStruct();
    if (!crypto_1.Transactions.Verifier.verifyHash(transaction)) {
        throw new Error("Failed to verify the transaction.");
    }
    return transaction;
};
exports.buildTransfer = async (params, method) => {
    const transactionBuilder = crypto_1.Transactions.BuilderFactory.transfer()
        .recipientId(params.recipientId)
        .amount(params.amount);
    if (params.vendorField) {
        transactionBuilder.vendorField(params.vendorField);
    }
    return buildTransaction("transfer", transactionBuilder, params, method);
};
exports.buildDelegateRegistration = async (params, method) => {
    const transactionBuilder = crypto_1.Transactions.BuilderFactory.delegateRegistration().usernameAsset(params.username);
    return buildTransaction("delegateRegistration", transactionBuilder, params, method);
};
exports.buildVote = async (params, method) => {
    const transactionBuilder = crypto_1.Transactions.BuilderFactory.vote().votesAsset([`+${params.publicKey}`]);
    return buildTransaction("vote", transactionBuilder, params, method);
};
exports.buildUnvote = async (params, method) => {
    const transactionBuilder = crypto_1.Transactions.BuilderFactory.vote().votesAsset([`-${params.publicKey}`]);
    return buildTransaction("vote", transactionBuilder, params, method);
};
//# sourceMappingURL=transactions.js.map