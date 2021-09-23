"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const logger_1 = require("../../logger");
const send_1 = require("../../shared/send");
const wallets_1 = require("../make/wallets");
class TransferCommand extends send_1.SendCommand {
    getCommand() {
        return TransferCommand;
    }
    async createWalletsWithBalance(flags) {
        return wallets_1.WalletCommand.run([`--quantity=${flags.number}`].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (let i = 0; i < flags.number; i++) {
            const vendorField = flags.vendorField || `Transaction ${i}`;
            if (flags.recipient) {
                transactions.push(this.signer.makeTransfer({ ...flags, ...{ recipient: flags.recipient, vendorField } }));
            }
            else {
                for (const wallet of Object.keys(wallets)) {
                    transactions.push(this.signer.makeTransfer({ ...flags, ...{ recipient: wallet, vendorField } }));
                }
            }
        }
        return transactions;
    }
    async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const currentBalance = await this.getWalletBalance(transaction.recipientId);
            wallets[transaction.recipientId].expectedBalance = currentBalance.plus(transaction.amount);
        }
    }
    async verifyTransactions(transactions, wallets) {
        for (const transaction of transactions) {
            const response = await this.getTransaction(transaction.id);
            if (!response) {
                logger_1.logger.error(`[T] ${transaction.id} (not forged)`);
                continue;
            }
            logger_1.logger.info(`[T] ${transaction.id} (${response.blockId})`);
            await this.knockBalance(transaction.recipientId, wallets[transaction.recipientId].expectedBalance);
            if (transaction.vendorField === response.vendorField) {
                logger_1.logger.info(`[T] ${transaction.id} (${transaction.vendorField})`);
            }
            else {
                logger_1.logger.error(`[T] ${transaction.id} (${transaction.vendorField} / ${response.vendorField})`);
            }
        }
    }
}
exports.TransferCommand = TransferCommand;
TransferCommand.description = "send multiple transactions";
TransferCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    recipient: command_1.flags.string({
        description: "recipient address",
    }),
    vendorField: command_1.flags.string({
        description: "vendor field to use",
    }),
};
//# sourceMappingURL=transfer.js.map