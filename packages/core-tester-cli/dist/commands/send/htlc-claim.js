"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const flags_1 = require("../../flags");
const htlc_secret_1 = require("../../shared/htlc-secret");
const send_1 = require("../../shared/send");
const htlc_lock_1 = require("./htlc-lock");
class HtlcClaimCommand extends send_1.SendCommand {
    getCommand() {
        return HtlcClaimCommand;
    }
    async createWalletsWithBalance(flags) {
        return htlc_lock_1.HtlcLockCommand.run([`--amount=${flags.amount}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const wallet of Object.values(wallets)) {
            const claimAsset = {
                unlockSecret: htlc_secret_1.htlcSecretHex,
                lockTransactionId: wallet.lockTransaction.id,
            };
            const transaction = this.signer.makeHtlcClaim({
                ...flags,
                ...{
                    claim: claimAsset,
                    htlcClaimFee: flags.htlcClaimFee,
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
exports.HtlcClaimCommand = HtlcClaimCommand;
HtlcClaimCommand.description = "create multiple htlc claim transactions";
HtlcClaimCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    htlcClaimFee: flags_1.satoshiFlag({
        description: "HTLC Claim fee",
        default: 0.1,
    }),
};
//# sourceMappingURL=htlc-claim.js.map