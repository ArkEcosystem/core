import { flags } from "@oclif/command";

import { buildBIP38 } from "../../common/crypto";
import { flagsForger, flagsNetwork, flagsToStrings } from "../../common/flags";
import { abortRunningProcess, daemonizeProcess } from "../../common/process";
import { AbstractStartCommand } from "../../shared/start";
import { CommandFlags } from "../../types";

export class StartCommand extends AbstractStartCommand {
    public static description = "Start the forger";

    public static examples: string[] = [
        `Run a forger with a bip39 passphrase
$ ark forger:start --bip39="..."
`,
        `Run a forger with an encrypted bip38
$ ark forger:start --bip38="..." --password="..."
`,
        `Run a forger without a daemon
$ ark forger:start --no-daemon
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        ...flagsForger,
        daemon: flags.boolean({
            description: "start the process as a daemon",
            default: true,
            allowNo: true,
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

        await buildBIP38(flags);

        daemonizeProcess(
            {
                name: `${flags.token}-forger`,
                // @ts-ignore
                script: this.config.options.root,
                args: `forger:run ${flagsToStrings(flags, ["daemon"])}`,
            },
            flags,
        );
    }
}
