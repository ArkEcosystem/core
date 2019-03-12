import { Address, configManager, models, NetworkName, slots } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import delay from "delay";
import { writeFileSync } from "fs";
import { satoshiFlag } from "../../flags";
import { copyToClipboard } from "../../utils";
import { BaseCommand } from "../command";

export class BlockCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flagsConfig,
        ...BaseCommand.flagsDebug,
        number: flags.integer({
            description: "number of blocks to generate",
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
    };

    public async run(): Promise<models.IBlock[]> {
        const { flags } = this.makeWithoutNetwork(BlockCommand);

        const genesisBlock = configManager.get("genesisBlock");
        const genesisWallets = genesisBlock.transactions.map(t => t.recipientId).filter(a => !!a);

        let previousBlock = flags.previousBlock ? JSON.parse(flags.previousBlock) : genesisBlock;

        const blocks: models.IBlock[] = [];

        for (let i = 0; i < flags.number; i++) {
            const milestone = configManager.getMilestone(previousBlock.height);
            const delegate = new models.Delegate(flags.passphrase, configManager.get("pubKeyHash"));

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

            const newBlock = await delegate.forge(transactions, {
                previousBlock,
                timestamp: slots.getSlotNumber(slots.getTime()) * milestone.blocktime,
                reward: milestone.reward,
            });
            previousBlock = newBlock.data;

            blocks.push(newBlock);
        }

        if (flags.log) {
            console.log(JSON.stringify(blocks, null, 4));
        }

        if (flags.copy) {
            copyToClipboard(JSON.stringify(blocks, null, 4));
        }

        if (flags.write) {
            writeFileSync("./blocks.json", JSON.stringify(blocks));
        }

        return blocks;
    }
}
