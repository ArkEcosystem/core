"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
// @TODO: better name
exports.dynamicFeeMatcher = async (transaction) => {
    const fee = transaction.data.fee;
    const id = transaction.id;
    const { dynamicFees } = core_container_1.app.resolveOptions("transaction-pool");
    const height = core_container_1.app
        .resolvePlugin("state")
        .getStore()
        .getLastHeight();
    let broadcast;
    let enterPool;
    if (dynamicFees.enabled) {
        const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
        const addonBytes = core_container_1.app.resolveOptions("transaction-pool").dynamicFees.addonBytes[transaction.key];
        const minFeeBroadcast = handler.dynamicFee({
            transaction,
            addonBytes,
            satoshiPerByte: dynamicFees.minFeeBroadcast,
            height,
        });
        if (fee.isGreaterThanEqual(minFeeBroadcast)) {
            broadcast = true;
            core_container_1.app.resolvePlugin("logger").debug(`Transaction ${id} eligible for broadcast - fee of ${crypto_1.Utils.formatSatoshi(fee)} is ${fee.isEqualTo(minFeeBroadcast) ? "equal to" : "greater than"} minimum fee (${crypto_1.Utils.formatSatoshi(minFeeBroadcast)})`);
        }
        else {
            broadcast = false;
            core_container_1.app.resolvePlugin("logger").debug(`Transaction ${id} not eligible for broadcast - fee of ${crypto_1.Utils.formatSatoshi(fee)} is smaller than minimum fee (${crypto_1.Utils.formatSatoshi(minFeeBroadcast)})`);
        }
        const minFeePool = handler.dynamicFee({
            transaction,
            addonBytes,
            satoshiPerByte: dynamicFees.minFeePool,
            height,
        });
        if (fee.isGreaterThanEqual(minFeePool)) {
            enterPool = true;
            core_container_1.app.resolvePlugin("logger").debug(`Transaction ${id} eligible to enter pool - fee of ${crypto_1.Utils.formatSatoshi(fee)} is ${fee.isEqualTo(minFeePool) ? "equal to" : "greater than"} minimum fee (${crypto_1.Utils.formatSatoshi(minFeePool)})`);
        }
        else {
            enterPool = false;
            core_container_1.app.resolvePlugin("logger").debug(`Transaction ${id} not eligible to enter pool - fee of ${crypto_1.Utils.formatSatoshi(fee)} is smaller than minimum fee (${crypto_1.Utils.formatSatoshi(minFeePool)})`);
        }
    }
    else {
        const staticFee = transaction.staticFee;
        if (fee.isEqualTo(staticFee)) {
            broadcast = true;
            enterPool = true;
            core_container_1.app.resolvePlugin("logger").debug(`Transaction ${id} eligible for broadcast and to enter pool - fee of ${crypto_1.Utils.formatSatoshi(fee)} is equal to static fee (${crypto_1.Utils.formatSatoshi(staticFee)})`);
        }
        else {
            broadcast = false;
            enterPool = false;
            core_container_1.app.resolvePlugin("logger").debug(`Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${crypto_1.Utils.formatSatoshi(fee)} does not match static fee (${crypto_1.Utils.formatSatoshi(staticFee)})`);
        }
    }
    return { broadcast, enterPool };
};
//# sourceMappingURL=dynamic-fee.js.map