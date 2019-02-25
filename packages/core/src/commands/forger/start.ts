import { flags } from "@oclif/command";
import { AbstractStartCommand } from "../../shared/start";
import { BaseCommand } from "../command";

export class StartCommand extends AbstractStartCommand {
    public static description: string = "Start the forger";

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

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsForger,
        daemon: flags.boolean({
            description: "start the process as a daemon",
            default: true,
            allowNo: true,
        }),
    };

    public getClass() {
        return StartCommand;
    }

    protected async runProcess(flags: Record<string, any>): Promise<void> {
        this.abortWhenRunning(`${flags.token}-core`);

        try {
            const { bip38, password } = await this.buildBIP38(flags);

            this.runWithPm2(
                {
                    name: `${flags.token}-forger`,
                    // @ts-ignore
                    script: this.config.options.root,
                    args: `forger:run ${this.flagsToStrings(flags, ["daemon"])}`,
                    env: {
                        CORE_FORGER_BIP38: bip38,
                        CORE_FORGER_PASSWORD: password,
                    },
                },
                flags,
            );
        } catch (error) {
            this.error(error.message);
        }
    }
}
