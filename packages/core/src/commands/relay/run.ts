import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import Command from "../command";

export class RelayRun extends Command {
    public static description = "Run the relay (no daemon)";

    public static examples = [`$ ark relay:run`];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(RelayRun);

        return this.buildApplication(app, {
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
