import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { BaseCommand } from "../command";

export class RunCommand extends BaseCommand {
    public static description: string = "Start the relay";

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(RunCommand);

        if (!flags.network) {
            await this.getNetwork(flags);
        }

        await this.buildApplication(app, flags, {
            exclude: ["@arkecosystem/core-forger"],
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
            },
        });
    }
}
