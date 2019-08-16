import { flags } from "@oclif/command";
import { validateMnemonic } from "bip39";
import fs from "fs-extra";
import prompts from "prompts";
import { CommandFlags } from "../../../types";
import { BaseCommand } from "../../command";

export class BIP39Command extends BaseCommand {
    public static description: string = "Configure the forging delegate (BIP39)";

    public static examples: string[] = [
        `Configure a delegate using a BIP39 passphrase
$ ark config:forger:bip39 --bip39="..."
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        bip39: flags.string({
            description: "the plain text bip39 passphrase",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(BIP39Command);

        if (flags.bip39) {
            return this.performConfiguration(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "password",
                name: "bip39",
                message: "Please enter your delegate passphrase",
                validate: value =>
                    !validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.bip39) {
            this.abortWithInvalidInput();
        }

        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }

    private async performConfiguration(flags): Promise<void> {
        const { config } = await this.getPaths(flags);

        // @TODO: update to follow new config convention
        const delegatesConfig = `${config}/config.js`;

        this.addTask("Prepare configuration", async () => {
            if (!fs.existsSync(delegatesConfig)) {
                this.error(`Couldn't find the delegates configuration at ${delegatesConfig}.`);
            }
        });

        this.addTask("Validate passphrase", async () => {
            if (!validateMnemonic(flags.bip39)) {
                this.error(`Failed to verify the given passphrase as BIP39 compliant.`);
            }
        });

        this.addTask("Write BIP39 to configuration", async () => {
            const { delegates } = require(delegatesConfig);
            delegates.secrets = [flags.bip39];
            delete delegates.bip38;

            fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, undefined, 2));
        });

        await this.runTasks();
    }
}
