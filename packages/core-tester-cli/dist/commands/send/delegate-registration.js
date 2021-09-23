"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const flags_1 = require("../../flags");
const logger_1 = require("../../logger");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class DelegateRegistrationCommand extends send_1.SendCommand {
    getCommand() {
        return DelegateRegistrationCommand;
    }
    async createWalletsWithBalance(flags) {
        return transfer_1.TransferCommand.run([`--amount=${flags.delegateFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const [address, wallet] of Object.entries(wallets)) {
            wallets[address].username = Math.random()
                .toString(36)
                .toLowerCase();
            transactions.push(this.signer.makeDelegate({
                ...flags,
                ...{
                    username: wallets[address].username,
                    // @ts-ignore
                    passphrase: wallet.passphrase,
                },
            }));
        }
        return transactions;
    }
    async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const recipientId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }
    async verifyTransactions(transactions, wallets) {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);
            if (wasCreated) {
                const recipientId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
                await this.knockBalance(recipientId, wallets[recipientId].expectedBalance);
                await this.knockUsername(recipientId, wallets[recipientId].username);
            }
        }
    }
    async knockUsername(address, expected) {
        const { username: actual } = (await this.api.get(`wallets/${address}`)).data;
        if (actual === expected) {
            logger_1.logger.info(`[W] ${address} (${actual})`);
        }
        else {
            logger_1.logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
}
exports.DelegateRegistrationCommand = DelegateRegistrationCommand;
DelegateRegistrationCommand.description = "create multiple delegates";
DelegateRegistrationCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    delegateFee: flags_1.satoshiFlag({
        description: "delegate registration fee",
        default: 25,
    }),
};
//# sourceMappingURL=delegate-registration.js.map