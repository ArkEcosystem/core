import { Commands, Container, Contracts, Utils } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";
import { resolve } from "path";

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
    public signature: string = "relay:start";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Start the Relay process.";

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
            .setFlag("daemon", "Start the Relay process as a daemon.", Joi.boolean().default(true));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const flags: Contracts.AnyObject = { ...this.getFlags() };

        this.actions.abortRunningProcess(`${flags.token}-core`);

        await this.actions.daemonizeProcess(
            {
                name: `${flags.token}-relay`,
                script: resolve(__dirname, "../../bin/run"),
                args: `relay:run ${Utils.castFlagsToString(flags, ["daemon"])}`,
            },
            flags,
        );
    }
}
