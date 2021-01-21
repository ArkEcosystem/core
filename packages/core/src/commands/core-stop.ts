import { Commands, Container } from "@arkecosystem/core-cli";
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
    public signature: string = "core:stop";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Stop the Core process.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("daemon", "Stop the Core process or daemon.", Joi.boolean());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        this.app
            .get<any>(Container.Identifiers.ProcessFactory)(this.getFlag("token"), "core")
            .stop(this.getFlag("daemon"));
    }
}
