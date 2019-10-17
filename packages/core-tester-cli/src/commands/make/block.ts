import { Delegate } from "@arkecosystem/core-forger";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { writeFileSync } from "fs";
import { satoshiFlag } from "../../flags";
import { copyToClipboard } from "../../utils";
import { BaseCommand } from "../command";

export class BlockCommand extends BaseCommand {
    public static description: string = "create new blocks";

    public static flags = {
        ...BaseCommand.flagsConfig,
        ...BaseCommand.flagsDebug,
        number: flags.integer({
            description: "number of blocks to generate",
            default: 1,
        }),
        nonce: flags.integer({
            description: "nonce to use for offline creation",
            default: 1,
        }),
        transactions: flags.integer({
            description: "number of transactions to generate",
            default: 0,
        }),
        transactionAmount: satoshiFlag({
            description: "initial wallet token amount",
            default: 2,
        }),
        transactionFee: satoshiFlag({
            description: "transfer fee",
            default: 0.1,
        }),
        passphrase: flags.string({
            description: "passphrase of the forger",
            default: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
        }),
        previousBlock: flags.string({
            description: `Previous block to base the generated block(s) on. For example: '{ "height": 50, "id": "123", "idHex": "7b" }'`,
        }),
        write: flags.boolean({
            description: "write the blocks to the disk",
        }),
        log: flags.boolean({
            description: "log the data to the console",
            default: true,
        }),
    };

    public async run(): Promise<Interfaces.IBlockJson[]> {
        const { flags } = this.makeOffline(BlockCommand);

        const genesisBlock = Managers.configManager.get("genesisBlock");
        const genesisWallets = genesisBlock.transactions.map(t => t.recipientId).filter(a => !!a);

        let previousBlock = flags.previousBlock ? JSON.parse(flags.previousBlock) : genesisBlock;

        const blocks: Interfaces.IBlockJson[] = [];

        for (let i = 0; i < flags.number; i++) {
            const milestone = Managers.configManager.getMilestone(previousBlock.height);
            const delegate = new Delegate(flags.passphrase, Managers.configManager.get("network.pubKeyHash"));

            const transactions = [];
            for (let i = 0; i < flags.transactions; i++) {
                transactions.push(
                    this.signer.makeTransfer({
                        ...flags,
                        ...{
                            amount: flags.transactionAmount + i,
                            transferFee: flags.transactionFee,
                            recipient: genesisWallets[Math.floor(Math.random() * genesisWallets.length)],
                        },
                    }),
                );
            }

            const newBlock = delegate.forge(transactions, {
                previousBlock,
                timestamp: Crypto.Slots.getSlotNumber(Crypto.Slots.getTime()) * milestone.blocktime,
                reward: milestone.reward,
            });

            const blockPayload: Interfaces.IBlockJson = newBlock.toJson();
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
            copyToClipboard(JSON.stringify(blocks, undefined, 4));
        }

        if (flags.write) {
            writeFileSync("./blocks.json", JSON.stringify(blocks));
        }

        return blocks;
    }
}
