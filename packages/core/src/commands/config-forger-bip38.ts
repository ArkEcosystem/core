import { Commands, Container, Contracts } from "@arkecosystem/core-cli";
import { Crypto, Identities, Managers } from "@arkecosystem/crypto";
import { Networks } from "@arkecosystem/crypto";
import { validateMnemonic } from "bip39";
import { writeJSONSync } from "fs-extra";
import Joi from "joi";
import wif from "wif";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "config:forger:bip38";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Configure the forging delegate (BIP38).";

    /**
     * Indicates whether the command should be shown in the command list.
     *
     * @type {boolean}
     * @memberof Command
     */
    public isHidden: boolean = true;

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("network", "The name of the network.", Joi.string().valid(...Object.keys(Networks)))
            .setFlag("bip39", "A delegate plain text passphrase. Referred to as BIP39.", Joi.string())
            .setFlag("password", "A custom password that encrypts the BIP39. Referred to as BIP38.", Joi.string())
            .setFlag("skipValidation", "Skip BIP39 mnemonic validation", Joi.boolean().default(false));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        if (this.hasFlag("bip39") && this.hasFlag("password")) {
            return this.performConfiguration(this.getFlags());
        }

        const response = await this.components.prompt([
            {
                type: "password",
                name: "bip39",
                message: "Please enter your delegate plain text passphrase. Referred to as BIP39.",
                validate: /* istanbul ignore next */ (value) =>
                    !validateMnemonic(value) && !this.getFlag("skipValidation")
                        ? "Failed to verify the given passphrase as BIP39 compliant."
                        : true,
            },
            {
                type: "password",
                name: "password",
                message: "Please enter your custom password that encrypts the BIP39. Referred to as BIP38.",
                validate: /* istanbul ignore next */ (value) =>
                    typeof value !== "string" ? "The BIP38 password has to be a string." : true,
            },
        ]);

        await this.components.prompt([
            {
                type: "password",
                name: "passwordConfirmation",
                message: "Confirm custom password that encrypts the BIP39. Referred to as BIP38.",
                validate: /* istanbul ignore next */ (value) =>
                    value !== response.password ? "Confirm password does not match BIP38 password." : true,
            },
        ]);

        if (!response.bip39) {
            throw new Error("Failed to verify the given passphrase as BIP39 compliant.");
        }

        if (!response.password) {
            throw new Error("The BIP38 password has to be a string.");
        }

        return this.performConfiguration({ ...this.getFlags(), ...response });
    }

    /**
     * @private
     * @param {Contracts.AnyObject} flags
     * @returns {Promise<void>}
     * @memberof Command
     */
    private async performConfiguration(flags: Contracts.AnyObject): Promise<void> {
        let decodedWIF;

        await this.components.taskList([
            {
                title: "Validating passphrase is BIP39 compliant.",
                task: () => {
                    if (!validateMnemonic(flags.bip39) && !flags.skipValidation) {
                        throw new Error(`Failed to verify the given passphrase as BIP39 compliant.`);
                    }
                },
            },
            {
                title: "Prepare crypto.",
                task: () => {
                    Managers.configManager.setFromPreset(flags.network);
                },
            },
            {
                title: "Loading private key.",
                task: () => {
                    // @ts-ignore
                    decodedWIF = wif.decode(Identities.WIF.fromPassphrase(flags.bip39));
                },
            },
            {
                title: "Encrypting BIP39 passphrase.",
                task: () => {
                    const delegatesConfig = this.app.getCorePath("config", "delegates.json");

                    const delegates = require(delegatesConfig);
                    delegates.bip38 = Crypto.bip38.encrypt(
                        decodedWIF.privateKey,
                        decodedWIF.compressed,
                        flags.password,
                    );
                    delegates.secrets = [];

                    writeJSONSync(delegatesConfig, delegates);
                },
            },
        ]);
    }
}
