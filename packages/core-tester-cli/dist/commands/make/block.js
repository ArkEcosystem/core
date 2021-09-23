"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_forger_1 = require("@arkecosystem/core-forger");
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const fs_1 = require("fs");
const flags_1 = require("../../flags");
const utils_1 = require("../../utils");
const command_2 = require("../command");
class BlockCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.makeOffline(BlockCommand);
        const genesisBlock = crypto_1.Managers.configManager.get("genesisBlock");
        const genesisWallets = genesisBlock.transactions.map(t => t.recipientId).filter(a => !!a);
        let previousBlock = flags.previousBlock ? JSON.parse(flags.previousBlock) : genesisBlock;
        const blocks = [];
        for (let i = 0; i < flags.number; i++) {
            const milestone = crypto_1.Managers.configManager.getMilestone(previousBlock.height);
            const delegate = new core_forger_1.Delegate(flags.passphrase, crypto_1.Managers.configManager.get("network.pubKeyHash"));
            const transactions = [];
            for (let i = 0; i < flags.transactions; i++) {
                transactions.push(this.signer.makeTransfer({
                    ...flags,
                    ...{
                        amount: flags.transactionAmount + i,
                        transferFee: flags.transactionFee,
                        recipient: genesisWallets[Math.floor(Math.random() * genesisWallets.length)],
                    },
                }));
            }
            const newBlock = delegate.forge(transactions, {
                previousBlock,
                timestamp: (crypto_1.Crypto.Slots.getSlotNumber(crypto_1.Crypto.Slots.getTime()) + i) * milestone.blocktime,
                reward: milestone.reward,
            });
            const blockPayload = newBlock.toJson();
            blockPayload.transactions = newBlock.transactions.map(tx => ({
                ...tx.toJson(),
                serialized: tx.serialized.toString("hex"),
            }));
            blockPayload.serialized = newBlock.serialized;
            previousBlock = blockPayload;
            blocks.push(blockPayload);
        }
        if (flags.log) {
            console.log(JSON.stringify(blocks, undefined, 4));
        }
        if (flags.copy) {
            utils_1.copyToClipboard(JSON.stringify(blocks, undefined, 4));
        }
        if (flags.write) {
            fs_1.writeFileSync("./blocks.json", JSON.stringify(blocks));
        }
        return blocks;
    }
}
exports.BlockCommand = BlockCommand;
BlockCommand.description = "create new blocks";
BlockCommand.flags = {
    ...command_2.BaseCommand.flagsConfig,
    ...command_2.BaseCommand.flagsDebug,
    number: command_1.flags.integer({
        description: "number of blocks to generate",
        default: 1,
    }),
    nonce: command_1.flags.integer({
        description: "nonce to use for offline creation",
        default: 1,
    }),
    transactions: command_1.flags.integer({
        description: "number of transactions to generate",
        default: 0,
    }),
    transactionAmount: flags_1.satoshiFlag({
        description: "initial wallet token amount",
        default: 2,
    }),
    transactionFee: flags_1.satoshiFlag({
        description: "transfer fee",
        default: 0.1,
    }),
    passphrase: command_1.flags.string({
        description: "passphrase of the forger",
        default: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
    }),
    previousBlock: command_1.flags.string({
        description: `Previous block to base the generated block(s) on. For example: '{ "height": 50, "id": "123", "idHex": "7b" }'`,
    }),
    write: command_1.flags.boolean({
        description: "write the blocks to the disk",
    }),
    log: command_1.flags.boolean({
        description: "log the data to the console",
        default: true,
    }),
};
//# sourceMappingURL=block.js.map