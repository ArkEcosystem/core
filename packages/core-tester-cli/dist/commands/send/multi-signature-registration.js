"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const flags_1 = require("../../flags");
const logger_1 = require("../../logger");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class MultiSignatureRegistrationCommand extends send_1.SendCommand {
    getCommand() {
        return MultiSignatureRegistrationCommand;
    }
    async createWalletsWithBalance(flags) {
        return transfer_1.TransferCommand.run([`--amount=${flags.multiSignatureFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const [address, wallet] of Object.entries(wallets)) {
            const transaction = this.signer.makeMultiSignatureRegistration({
                ...flags,
                ...{
                    passphrase: wallet.passphrase,
                    secondPassphrase: wallet.passphrase,
                },
            });
            wallets[address].publicKey = transaction.senderPublicKey;
            transactions.push(transaction);
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
                await this.knockSignature(recipientId, wallets[recipientId].secondPublicKey);
            }
        }
    }
    async knockSignature(address, expected) {
        const { secondPublicKey: actual } = (await this.api.get(`wallets/${address}`)).data;
        if (actual === expected) {
            logger_1.logger.info(`[W] ${address} (${actual})`);
        }
        else {
            logger_1.logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
}
exports.MultiSignatureRegistrationCommand = MultiSignatureRegistrationCommand;
MultiSignatureRegistrationCommand.description = "create wallets with multi signature";
MultiSignatureRegistrationCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    multiSignatureFee: flags_1.satoshiFlag({
        description: "multi signature fee",
        default: 25,
    }),
    participants: command_1.flags.string({
        description: "public keys of multi signature participants",
        default: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37," +
            "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d," +
            "0290907d441d257334c4376126d6cbf37cd7993ca2d0cc58850b30b869d4bf4c3e",
    }),
    passphrases: command_1.flags.string({
        description: "passphrases of participants used for signing",
        default: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire," +
            "venue below waste gather spin cruise title still boost mother flash tuna," +
            "craft imitate step mixture patch forest volcano business charge around girl confir",
    }),
    min: command_1.flags.integer({
        description: "minimum number of participants required",
        default: 3,
    }),
};
//# sourceMappingURL=multi-signature-registration.js.map