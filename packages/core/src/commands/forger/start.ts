import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { join } from "path";
import prompts from "prompts";
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

    protected async runWithDaemon(flags: Record<string, any>): Promise<void> {
        try {
            const { bip38, password } = await this.buildBIP38(flags);

            this.runWithPm2({
                name: `${flags.token}-forger`,
                // @ts-ignore
                script: this.config.options.root,
                args: `forger:start --no-daemon ${this.flagsToStrings(flags)}`,
                env: {
                    CORE_FORGER_BIP38: bip38,
                    CORE_FORGER_PASSWORD: password,
                },
            });
        } catch (error) {
            this.error(error.message);
        }
    }

    protected async runWithoutDaemon(flags: Record<string, any>): Promise<void> {
        await this.buildApplication(app, flags, {
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-config",
                "@arkecosystem/core-logger",
                "@arkecosystem/core-logger-winston",
                "@arkecosystem/core-forger",
            ],
            options: {
                "@arkecosystem/core-forger": await this.buildBIP38(flags),
            },
        });
    }

    private async buildBIP38(flags: Record<string, any>) {
        // defaults
        let bip38 = flags.bip38;
        let password = flags.password;

        // config
        const { config } = await this.getPaths(flags);
        const delegates = require(join(config, "delegates.json"));

        if (!bip38 && delegates.bip38) {
            bip38 = delegates.bip38;
        }

        if (!bip38 && !delegates.secrets.length) {
            this.error("We were unable to detect a BIP38 or BIP39 passphrase.");
        }

        // fallback
        if (bip38 && !password) {
            const response = await prompts([
                {
                    type: "password",
                    name: "password",
                    message: "Please enter your BIP38 password",
                },
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                    initial: true,
                },
            ]);

            if (!response.password) {
                this.error("We've detected that you are using BIP38 but have not provided the password flag.");
            }

            password = response.password;
        }

        return { bip38, password };
    }
}
