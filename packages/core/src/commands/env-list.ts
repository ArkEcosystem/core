import { Commands, Container } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";
import { parseFileSync } from "envfile";
import { existsSync } from "fs-extra";

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
    public signature: string = "env:list";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "List all environment variables.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("network", "The name of the network.", Joi.string().valid(...Object.keys(Networks)));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const envFile: string = this.app.getCorePath("config", ".env");

        if (!existsSync(envFile)) {
            this.components.fatal(`No environment file found at ${envFile}.`);
        }

        this.components.table(["Key", "Value"], (table) => {
            const env = parseFileSync(envFile);

            for (const [key, value] of Object.entries(env)) {
                table.push([key, value]);
            }
        });
    }
}
