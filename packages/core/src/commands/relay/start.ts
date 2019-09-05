import { flags } from "@oclif/command";

import { flagsBehaviour, flagsNetwork, flagsToStrings } from "../../common/flags";
import { abortRunningProcess, daemonizeProcess } from "../../common/process";
import { AbstractStartCommand } from "../../shared/start";
import { CommandFlags } from "../../types";

export class StartCommand extends AbstractStartCommand {
    public static description = "Start the relay";

    public static examples: string[] = [
        `Run a relay with a pm2 daemon
$ ark relay:start --network=mainnet
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
        `Run a relay without a daemon
$ ark relay:start --no-daemon
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        ...flagsBehaviour,
        daemon: flags.boolean({
            description: "start the process as a daemon",
            default: true,
            allowNo: true,
        }),
        suffix: flags.string({
            hidden: true,
            default: "relay",
        }),
        env: flags.string({
            default: "production",
        }),
    };

    public getClass() {
        return StartCommand;
    }

    protected async runProcess(flags: CommandFlags): Promise<void> {
        abortRunningProcess(`${flags.token}-core`);

        daemonizeProcess(
            {
                name: `${flags.token}-relay`,
                // @ts-ignore
                script: this.config.options.root,
                args: `relay:run ${flagsToStrings(flags, ["daemon"])}`,
            },
            flags,
        );
    }
}
