import { Commands, Container, Utils } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";

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
    public signature: string = "manager:run";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string =
        "Run the Manager process in background. Exiting the process will stop it from running.";

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
            .setFlag("env", "", Joi.string().default("production"));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const flags = { ...this.getFlags() };
        flags.processType = "manager";

        await Utils.buildApplication({
            flags,
            plugins: {},
        });

        // Prevent resolving execute method
        return new Promise(() => {});
    }
}
