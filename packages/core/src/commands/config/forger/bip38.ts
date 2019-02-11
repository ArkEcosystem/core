import { configManager, crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import bip38 from "bip38";
import bip39 from "bip39";
import fs from "fs-extra";
import prompts from "prompts";
import wif from "wif";
import { BaseCommand } from "../../command";

export class BIP38Command extends BaseCommand {
    public static description: string = "Configure the forging delegate (BIP38)";

    public static examples: string[] = [
        `Configure a delegate using an encrypted BIP38
$ ark config:forger:bip38 --bip39="..." --password="..."
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        bip39: flags.string({
            char: "b",
            description: "the plain text bip39 passphrase",
        }),
        password: flags.string({
            char: "p",
            description: "the password for the encrypted bip38",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(BIP38Command);

        if (flags.bip39 && flags.password) {
            return this.performConfiguration(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "password",
                name: "bip39",
                message: "Please enter your delegate passphrase",
                validate: value =>
                    !bip39.validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
            },
            {
                type: "password",
                name: "password",
                message: "Please enter your desired BIP38 password",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
                initial: true,
            },
        ]);

        if (!response.bip39 || !response.password) {
            this.abortWithInvalidInput();
        }

        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }

    private async performConfiguration(flags): Promise<void> {
        const { config } = await this.getPaths(flags);

        const delegatesConfig = `${config}/delegates.json`;
        let decodedWIF;

        this.addTask("Prepare configuration", async () => {
            if (!fs.existsSync(delegatesConfig)) {
                throw new Error(`Couldn't find the core configuration at ${delegatesConfig}.`);
            }
        });

        this.addTask("Validate passphrase", async () => {
            if (!bip39.validateMnemonic(flags.bip39)) {
                throw new Error(`Failed to verify the given passphrase as BIP39 compliant.`);
            }
        });

        this.addTask("Prepare crypto", async () => {
            configManager.setFromPreset(flags.network);
        });

        this.addTask("Loading private key", async () => {
            const keys = crypto.getKeys(flags.bip39);
            // @ts-ignore
            decodedWIF = wif.decode(crypto.keysToWIF(keys));
        });

        this.addTask("Encrypt BIP38", async () => {
            const delegates = require(delegatesConfig);
            delegates.bip38 = bip38.encrypt(decodedWIF.privateKey, decodedWIF.compressed, flags.password);
            delegates.secrets = [];

            fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));
        });

        await this.runTasks();
    }
}
