import { Commands, Container, Contracts, Utils } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";

import { buildBIP38 } from "../internal/crypto";

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
    public signature: string = "core:run";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Run the Core process in foreground. Exiting the process will stop it from running.";

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
            .setFlag("env", "", Joi.string().default("production"))
            .setFlag("networkStart", "Indicate that this is the first start of seeds.", Joi.boolean())
            .setFlag("disableDiscovery", "Permanently disable all peer discovery.", Joi.boolean())
            .setFlag("skipDiscovery", "Skip the initial peer discovery.", Joi.boolean())
            .setFlag("ignoreMinimumNetworkReach", "Ignore the minimum network reach on start.", Joi.boolean())
            .setFlag("launchMode", "The mode the relay will be launched in (seed only at the moment).", Joi.string())
            .setFlag("bip38", "", Joi.string())
            .setFlag("bip39", "A delegate plain text passphrase. Referred to as BIP39.", Joi.string())
            .setFlag("password", "A custom password that encrypts the BIP39. Referred to as BIP38.", Joi.string())
            .setFlag("skipPrompts", "Skip prompts.", Joi.boolean().default(false));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const flags: Contracts.AnyObject = { ...this.getFlags() };
        flags.processType = "core";

        await Utils.buildApplication({
            flags,
            plugins: {
                "@arkecosystem/core-p2p": Utils.buildPeerFlags(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
                "@arkecosystem/core-forger": await buildBIP38(flags, this.app.getCorePath("config")),
            },
        });

        // Prevent resolving execute method
        return new Promise(() => {});
    }
}
