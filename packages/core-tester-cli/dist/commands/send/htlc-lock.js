"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const flags_1 = require("../../flags");
const htlc_secret_1 = require("../../shared/htlc-secret");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class HtlcLockCommand extends send_1.SendCommand {
    getCommand() {
        return HtlcLockCommand;
    }
    async createWalletsWithBalance(flags) {
        return transfer_1.TransferCommand.run([`--amount=${flags.htlcLockFee + flags.amount}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const wallet of Object.values(wallets)) {
            const lockAsset = {
                secretHash: htlc_secret_1.htlcSecretHashHex,
                expiration: { type: 1, value: Math.floor((Date.now() + flags.expiration * 1000) / 1000) },
            };
            const transaction = this.signer.makeHtlcLock({
                ...flags,
                ...{
                    lock: lockAsset,
                    amount: flags.amount,
                    recipient: flags.recipient || wallet.address,
                    htlcLockFee: flags.htlcLockFee,
                    passphrase: wallet.passphrase,
                },
            });
            wallet.lockTransaction = transaction;
            // this is used by claim and refund commands
            transactions.push(transaction);
        }
        return transactions;
    }
    async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const senderId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
            const currentBalance = await this.getWalletBalance(senderId);
            wallets[senderId].expectedBalance = currentBalance.minus(transaction.fee).minus(transaction.amount);
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
exports.HtlcLockCommand = HtlcLockCommand;
HtlcLockCommand.description = "create multiple htlc lock transactions";
HtlcLockCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    htlcLockFee: flags_1.satoshiFlag({
        description: "HTLC Lock fee",
        default: 0.1,
    }),
    expiration: command_1.flags.integer({
        description: "expiration in seconds relative to now",
        default: 999,
    }),
};
//# sourceMappingURL=htlc-lock.js.map