import { flags } from "@oclif/command";
import { AbstractStartCommand } from "../../shared/start";
import { BaseCommand } from "../command";

export class StartCommand extends AbstractStartCommand {
    public static description: string = "Start the core";

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

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
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
        this.createPm2Connection(() => {
            this.describePm2Process(`${flags.token}-forger`, forger => {
                this.abortWhenRunning(`${flags.token}-forger`, forger);

                this.describePm2Process(`${flags.token}-relay`, async relay => {
                    this.abortWhenRunning(`${flags.token}-relay`, relay);

                    try {
                        const { bip38, password } = await this.buildBIP38(flags);

                        this.runWithPm2(
                            {
                                name: `${flags.token}-core`,
                                // @ts-ignore
                                script: this.config.options.root,
                                args: `core:run ${this.flagsToStrings(flags, ["daemon"])}`,
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
                });
            });
        });
    }
}
