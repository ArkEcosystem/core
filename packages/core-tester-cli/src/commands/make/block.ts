import { bignumify } from "@arkecosystem/core-utils";
import { Address, configManager, models, slots } from "@arkecosystem/crypto";
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
        log: flags.boolean({
            description: "write the blocks to the CLI",
        }),
        copy: flags.boolean({
            description: "write the blocks to the clipboard",
        }),
        write: flags.boolean({
            description: "write the blocks to the disk",
        }),
    };

    public async run(): Promise<models.IBlock[]> {
        const { flags } = await this.make(BlockCommand);

        configManager.setFromPreset("unitnet");

        // We always start with the genesis block!
        let previousBlock = configManager.get("genesisBlock");

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
                            amount: flags.transactionAmount + 10,
                            transferFee: flags.transactionFee,
                            recipient: Address.fromPassphrase(flags.passphrase),
                        },
                    }),
                );

                await delay(100);
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
