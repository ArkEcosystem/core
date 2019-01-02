import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { start } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class ForgerStart extends BaseCommand {
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
            char: "d",
            description: "stop the process and daemon",
            default: true,
            allowNo: true,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ForgerStart);

        if (!flags.daemon) {
            return this.runWithoutDaemon(flags);
        }

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

    private async runWithoutDaemon(flags: Record<string, any>) {
        return this.buildApplication(app, {
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-config",
                "@arkecosystem/core-logger",
                "@arkecosystem/core-logger-winston",
                "@arkecosystem/core-forger",
            ],
            options: {
                "@arkecosystem/core-forger": {
                    bip38: flags.bip38,
                    password: flags.password,
                },
            },
        });
    }
}
