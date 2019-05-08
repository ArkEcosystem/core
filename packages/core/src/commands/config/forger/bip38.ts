import { Crypto, Identities, Managers } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { validateMnemonic } from "bip39";
import fs from "fs-extra";
import prompts from "prompts";
import wif from "wif";
import { CommandFlags } from "../../../types";
import { BaseCommand } from "../../command";

export class BIP38Command extends BaseCommand {
    public static description: string = "Configure the forging delegate (BIP38)";

    public static examples: string[] = [
        `Configure a delegate using an encrypted BIP38
$ ark config:forger:bip38 --bip39="..." --password="..."
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        bip39: flags.string({
            description: "the plain text bip39 passphrase",
        }),
        password: flags.string({
            description: "the password for the encrypted bip38",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(BIP38Command);

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
                    !validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
            },
            {
                type: "password",
                name: "password",
                message: "Please enter your desired BIP38 password",
                validate: value => (typeof value !== "string" ? `The BIP38 password has to be a string.` : true),
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
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
                this.error(`Couldn't find the delegates configuration at ${delegatesConfig}.`);
            }
        });

        this.addTask("Validate passphrase", async () => {
            if (!validateMnemonic(flags.bip39)) {
                this.error(`Failed to verify the given passphrase as BIP39 compliant.`);
            }
        });

        this.addTask("Prepare crypto", async () => {
            Managers.configManager.setFromPreset(flags.network);
        });

        this.addTask("Loading private key", async () => {
            // @ts-ignore
            decodedWIF = wif.decode(Identities.WIF.fromPassphrase(flags.bip39));
        });

        this.addTask("Encrypt BIP38", async () => {
            const delegates = require(delegatesConfig);
            delegates.bip38 = Crypto.bip38.encrypt(decodedWIF.privateKey, decodedWIF.compressed, flags.password);
            delegates.secrets = [];

            fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, undefined, 2));
        });

        await this.runTasks();
    }
}
