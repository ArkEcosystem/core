"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const flags_1 = require("../../flags");
const send_1 = require("../../shared/send");
const htlc_lock_1 = require("./htlc-lock");
class HtlcRefundCommand extends send_1.SendCommand {
    getCommand() {
        return HtlcRefundCommand;
    }
    async createWalletsWithBalance(flags) {
        return htlc_lock_1.HtlcLockCommand.run([`--amount=${flags.amount}`, `--expiration=1`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const wallet of Object.values(wallets)) {
            const refundAsset = {
                lockTransactionId: wallet.lockTransaction.id,
            };
            const transaction = this.signer.makeHtlcRefund({
                ...flags,
                ...{
                    refund: refundAsset,
                    htlcRefundFee: flags.htlcRefundFee,
                    passphrase: wallet.passphrase,
                },
            });
            transactions.push(transaction);
        }
        return transactions;
    }
    async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const senderId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
            const currentBalance = await this.getWalletBalance(senderId);
            wallets[senderId].expectedBalance = currentBalance
                .minus(transaction.fee)
                .plus(wallets[senderId].lockTransaction.amount);
        }
    }
    async verifyTransactions(transactions, wallets) {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);
            if (wasCreated) {
                const senderId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
            }
        }
    }
}
exports.HtlcRefundCommand = HtlcRefundCommand;
HtlcRefundCommand.description = "create multiple htlc refund transactions";
HtlcRefundCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    htlcRefundFee: flags_1.satoshiFlag({
        description: "HTLC Refund fee",
        default: 0.1,
    }),
};
//# sourceMappingURL=htlc-refund.js.map