import { Commands, Container } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";

import { Command as BIP38Command } from "./config-forger-bip38";
import { Command as BIP39Command } from "./config-forger-bip39";

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
    public signature: string = "config:forger";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Configure the forging delegate.";

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
            .setFlag("bip38", "", Joi.string())
            .setFlag("bip39", "A delegate plain text passphrase. Referred to as BIP39.", Joi.string())
            .setFlag("password", "A custom password that encrypts the BIP39. Referred to as BIP38.", Joi.string())
            .setFlag(
                "method",
                "The configuration method to use (BIP38 or BIP39).",
                Joi.string().valid(...["bip38", "bip39"]),
            )
            .setFlag("skipValidation", "Skip BIP39 mnemonic validation", Joi.boolean().default(false));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        if (this.getFlag("method") === "bip38") {
            return await this.initializeAndExecute(BIP38Command);
        }

        if (this.getFlag("method") === "bip39") {
            return await this.initializeAndExecute(BIP39Command);
        }

        let response = await this.components.prompt([
            {
                type: "select",
                name: "method",
                message: "Please select how you wish to store your delegate passphrase?",
                choices: [
                    { title: "Encrypted BIP38 (Recommended)", value: "bip38" },
                    { title: "Plain BIP39", value: "bip39" },
                ],
            },
        ]);

        if (!response.method) {
            this.components.fatal("Please enter valid data and try again!");
        }

        response = { ...this.getFlags(), ...response };

        if (response.method === "bip38") {
            return await this.initializeAndExecute(BIP38Command);
        }

        if (response.method === "bip39") {
            return await this.initializeAndExecute(BIP39Command);
        }
    }

    private async initializeAndExecute(commandSignature): Promise<void> {
        const cmd = this.app.resolve<Commands.Command>(commandSignature);

        const flags = this.getFlags();
        cmd.configure();
        cmd.register([]);

        for (const flag in flags) {
            cmd.setFlag(flag, flags[flag]);
        }

        return await cmd.run();
    }
}
