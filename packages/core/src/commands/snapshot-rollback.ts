import { Commands, Container } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

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
    public signature: string = "snapshot:rollback";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Rollback chain to specified height.";

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
            .setFlag("skipCompression", "Skip gzip compression.", Joi.boolean())
            .setFlag("trace", "Dumps generated queries and settings to console.", Joi.boolean())
            .setFlag("height", "The height after the roll back.", Joi.number())
            .setFlag("number", "The number of blocks to roll back.", Joi.number())
            .setFlag("export", "Export the rolled back transactions.", Joi.boolean().default(true));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        this.components.fatal("This command has not been implemented.");
    }
}
