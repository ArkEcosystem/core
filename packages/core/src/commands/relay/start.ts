import { start } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class RelayStart extends Command {
    public static description = "Start the relay";

    public static examples = [
        `Run a mainnet relay
$ ark relay:start --network=mainnet
`,
        `Run a relay with custom data and config paths
$ ark relay:start --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
        `Run a genesis relay
$ ark relay:start --networkStart
`,
        `Disable any discovery by other peers
$ ark relay:start --disableDiscovery
`,
        `Skip the initial discovery
$ ark relay:start --skipDiscovery
`,
        `Ignore the minimum network reach
$ ark relay:start --ignoreMinimumNetworkReach
`,
        `Start a seed
$ ark relay:start --launchMode=seed
`,
        `Run a relay without any public facing services
$ ark relay:start --preset=relay-minimal
`,
    ];

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
            args: `relay:start ${this.flagsToStrings(flags)}`,
        });
    }
}
