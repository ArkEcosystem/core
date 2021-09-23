"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const flags_1 = require("../../flags");
const logger_1 = require("../../logger");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class VoteCommand extends send_1.SendCommand {
    getCommand() {
        return VoteCommand;
    }
    async createWalletsWithBalance(flags) {
        return transfer_1.TransferCommand.run([`--amount=${flags.voteFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const [address, wallet] of Object.entries(wallets)) {
            const delegate = flags.delegate || (await this.getRandomDelegate());
            const transaction = this.signer.makeVote({
                ...flags,
                ...{
                    delegate,
                    passphrase: wallet.passphrase,
                },
            });
            wallets[address].vote = delegate;
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
                await this.knockVote(recipientId, wallets[recipientId].vote);
            }
        }
    }
    async knockVote(address, expected) {
        const { vote: actual } = (await this.api.get(`wallets/${address}`)).data;
        if (actual === expected) {
            logger_1.logger.info(`[W] ${address} (${actual})`);
        }
        else {
            logger_1.logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
    async getRandomDelegate() {
        const { data } = await this.api.get("delegates");
        return data[0].publicKey;
    }
}
exports.VoteCommand = VoteCommand;
VoteCommand.description = "create multiple votes for a delegate";
VoteCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    delegate: command_1.flags.string({
        description: "delegate public key",
    }),
    voteFee: flags_1.satoshiFlag({
        description: "vote fee",
        default: 1,
    }),
};
//# sourceMappingURL=vote.js.map