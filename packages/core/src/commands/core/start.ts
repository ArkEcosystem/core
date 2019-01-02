import { flags } from "@oclif/command";
import { start } from "../../pm2";
import Command from "../command";

export class CoreStart extends Command {
    public static description = "Start the core";

    public static examples = [`$ ark core:start`];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(CoreStart);

        start({
            name: "ark-core",
            script: "./dist/index.js",
            args: `core:run ${this.flagsToStrings(flags)}`,
            env: {
                ARK_FORGER_BIP38: flags.bip38,
                ARK_FORGER_PASSWORD: flags.password,
            },
        });
    }
}
