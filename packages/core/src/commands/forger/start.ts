import { flags } from "@oclif/command";
import { start } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class ForgerStart extends Command {
    public static description = "Start the forger";

    public static examples = [
        `Run a forger with a bip39 passphrase
$ ark forger:start --bip39="..."
`,
        `Run a forger with an encrypted bip38
$ ark forger:start --bip38="..." --password="..."
`,
    ];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(ForgerStart);

        start({
            name: "ark-core-forger",
            script: "./dist/index.js",
            args: `forger:run ${this.flagsToStrings(flags)}`,
            env: {
                ARK_FORGER_BIP38: flags.bip38,
                ARK_FORGER_PASSWORD: flags.password,
            },
        });
    }
}
