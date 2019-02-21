import { flags } from "@oclif/command";
import delay from "delay";
import { BaseCommand } from "./command";

export class TransferCommand extends BaseCommand {
    public static description: string = "send multiple transactions";

    public static flags = {
        ...BaseCommand.flags,
        recipient: flags.string({
            description: "recipient address",
        }),
        vendorField: flags.string({
            description: "vendor field to use",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.make(TransferCommand);

        const transaction = this.signTransaction(flags);

        await this.sendTransaction(transaction);

        await delay(8000);

        await this.knockTransaction(transaction.id);
    }
}
