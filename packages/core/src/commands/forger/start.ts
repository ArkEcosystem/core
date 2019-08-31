import { flags } from "@oclif/command";

import { AbstractStartCommand } from "../../shared/start";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

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
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsForger,
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
        this.abortRunningProcess(`${flags.token}-core`);

        try {
            await this.buildBIP38(flags);

            await this.runWithPm2(
                {
                    name: `${flags.token}-forger`,
                    // @ts-ignore
                    script: this.config.options.root,
                    args: `forger:run ${this.flagsToStrings(flags, ["daemon"])}`,
                },
                flags,
            );
        } catch (error) {
            this.error(error.message);
        }
    }
}
