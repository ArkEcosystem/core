import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import Command from "../command";

class CoreRun extends Command {
    public static description = "Run the core (no daemon)";

    public static examples = [`$ ark core:run`];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(CoreRun);

        return this.buildApplication(app, {
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
                "@arkecosystem/core-forger": {
                    bip38: flags.bip38 || process.env.ARK_FORGER_BIP38,
                    password: flags.password || process.env.ARK_FORGER_BIP39,
                },
            },
        });
    }
}
