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
    public signature: string = "env:get";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Get the value of an environment variable.";

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
            .setFlag(
                "key",
                "The name of the environment variable that you wish to get the value of.",
                Joi.string().required(),
            );
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

        const env: object = parseFileSync(envFile);
        const key: string = this.getFlag("key");

        if (!env[key]) {
            this.components.fatal(`The "${key}" doesn't exist.`);
        }

        this.components.log(env[key]);
    }
}
