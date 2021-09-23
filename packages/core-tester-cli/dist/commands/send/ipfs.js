"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const flags_1 = require("../../flags");
const send_1 = require("../../shared/send");
const transfer_1 = require("./transfer");
class IpfsCommand extends send_1.SendCommand {
    getCommand() {
        return IpfsCommand;
    }
    async createWalletsWithBalance(flags) {
        return transfer_1.TransferCommand.run([`--amount=${flags.ipfsFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)));
    }
    async signTransactions(flags, wallets) {
        const transactions = [];
        for (const wallet of Object.values(wallets)) {
            const ipfs = `Qm${wallet.address.repeat(2).slice(0, 44)}`;
            // we use stripped address as ipfs hash with Qm indicating SHA-256
            const transaction = this.signer.makeIpfs({
                ...flags,
                ...{
                    ipfs,
                    ipfsFee: flags.ipfsFee,
                    passphrase: wallet.passphrase,
                },
            });
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
            }
        }
    }
}
exports.IpfsCommand = IpfsCommand;
IpfsCommand.description = "create multiple ipfs transactions";
IpfsCommand.flags = {
    ...send_1.SendCommand.flagsSend,
    ipfsFee: flags_1.satoshiFlag({
        description: "IPFS fee",
        default: 5,
    }),
};
//# sourceMappingURL=ipfs.js.map