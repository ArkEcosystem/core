import { flags } from "@oclif/command";

import { buildBIP38 } from "../../common/crypto";
import { flagsBehaviour, flagsForger, flagsNetwork, flagsToStrings } from "../../common/flags";
import { abortRunningProcess, daemonizeProcess } from "../../common/process";
import { AbstractStartCommand } from "../../shared/start";
import { CommandFlags } from "../../types";

export class StartCommand extends AbstractStartCommand {
    public static description = "Start the core";

    public static examples: string[] = [
        `Run core with a daemon
$ ark core:start
`,
        `Run core as genesis
$ ark core:start --networkStart
`,
        `Disable any discovery by other peers
$ ark core:start --disableDiscovery
`,
        `Skip the initial discovery
$ ark core:start --skipDiscovery
`,
        `Ignore the minimum network reach
$ ark core:start --ignoreMinimumNetworkReach
`,
        `Start a seed
$ ark core:start --launchMode=seed
`,
        `Run core without a daemon
$ ark core:start --no-daemon
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        ...flagsBehaviour,
        ...flagsForger,
        daemon: flags.boolean({
            description: "start the process as a daemon",
            default: true,
            allowNo: true,
        }),
        suffix: flags.string({
            hidden: true,
            default: "core",
        }),
        env: flags.string({
            default: "production",
        }),
    };

    public getClass() {
        return StartCommand;
    }

    protected async runProcess(flags: CommandFlags): Promise<void> {
        abortRunningProcess(`${flags.token}-forger`);
        abortRunningProcess(`${flags.token}-relay`);

        await buildBIP38(flags);

        daemonizeProcess(
            {
                name: `${flags.token}-core`,
                // @ts-ignore
                script: this.config.options.root,
                args: `core:run ${flagsToStrings(flags, ["daemon"])}`,
            },
            flags,
        );
    }
}
