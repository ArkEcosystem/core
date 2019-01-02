import { flags } from "@oclif/command";
import { start } from "../../pm2";
import Command from "../command";

export class RelayStart extends Command {
    public static description = "Start the relay";

    public static examples = [`$ ark relay:start`];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(RelayStart);

        start({
            name: "ark-core-relay",
            script: "./dist/index.js",
            args: `relay:run ${this.flagsToStrings(flags)}`,
        });
    }
}
