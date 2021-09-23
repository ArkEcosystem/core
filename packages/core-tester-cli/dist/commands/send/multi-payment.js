"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const flags_1 = require("../../flags");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class MultiPaymentCommand extends send_1.SendCommand {
    getCommand() {
        return MultiPaymentCommand;
    }
    async createWalletsWithBalance(flags) {
        const amountToTransfer = flags.multipaymentFee +
            flags.amounts
                .split(",")
                .map(amountStr => crypto_1.Utils.BigNumber.make(amountStr))
                .reduce((prev, curr) => prev.plus(curr), crypto_1.Utils.BigNumber.ZERO);
        return transfer_1.TransferCommand.run([`--amount=${amountToTransfer}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const amounts = flags.amounts.split(",");
        const recipients = flags.recipients.split(",");
        const payments = amounts.map((amount, i) => ({ amount, recipientId: recipients[i] }));
        const transactions = [];
        for (const wallet of Object.values(wallets)) {
            const transaction = this.signer.makeMultipayment({
                ...flags,
                payments,
                passphrase: wallet.passphrase,
            });
            transactions.push(transaction);
        }
        return transactions;
    }
    async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            for (const payment of transaction.asset.payments) {
                const currentBalance = await this.getWalletBalance(payment.recipientId);
                wallets[payment.recipientId].expectedBalance = currentBalance.plus(payment.amount);
            }
            const senderId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
            const currentBalance = await this.getWalletBalance(senderId);
            wallets[senderId].expectedBalance = currentBalance.minus(transaction.fee).minus(transaction.amount);
        }
    }
    async verifyTransactions(transactions, wallets) {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);
            if (wasCreated) {
                for (const payment of transaction.asset.payments) {
                    await this.knockBalance(payment.recipientId, wallets[payment.recipientId].expectedBalance);
                }
                const senderId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
            }
        }
    }
}
exports.MultiPaymentCommand = MultiPaymentCommand;
MultiPaymentCommand.description = "create wallets with multi signature";
MultiPaymentCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    multipaymentFee: flags_1.satoshiFlag({
        description: "multi payment fee",
        default: 0.1,
    }),
    recipients: command_1.flags.string({
        description: "public keys of recipients",
        default: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37," +
            "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d," +
            "0290907d441d257334c4376126d6cbf37cd7993ca2d0cc58850b30b869d4bf4c3e",
    }),
    amounts: command_1.flags.string({
        description: "amount to send to the recipients",
        default: "1000,2000,3000",
    }),
};
//# sourceMappingURL=multi-payment.js.map