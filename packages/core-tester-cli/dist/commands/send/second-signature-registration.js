"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const flags_1 = require("../../flags");
const logger_1 = require("../../logger");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class SecondSignatureRegistrationCommand extends send_1.SendCommand {
    getCommand() {
        return SecondSignatureRegistrationCommand;
    }
    async createWalletsWithBalance(flags) {
        return transfer_1.TransferCommand.run([`--amount=${flags.signatureFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const [address, wallet] of Object.entries(wallets)) {
            const transaction = this.signer.makeSecondSignature({
                ...flags,
                ...{
                    passphrase: wallet.passphrase,
                    secondPassphrase: wallet.passphrase,
                },
            });
            wallets[address].publicKey = transaction.senderPublicKey;
            wallets[address].secondPublicKey = transaction.asset.signature.publicKey;
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
exports.SecondSignatureRegistrationCommand = SecondSignatureRegistrationCommand;
SecondSignatureRegistrationCommand.description = "create wallets with second signature";
SecondSignatureRegistrationCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    signatureFee: flags_1.satoshiFlag({
        description: "second signature fee",
        default: 5,
    }),
};
//# sourceMappingURL=second-signature-registration.js.map