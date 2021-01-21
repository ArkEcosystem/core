import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
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
     * @private
     * @type {Environment}
     * @memberof Command
     */
    @Container.inject(Container.Identifiers.Environment)
    private readonly environment!: Services.Environment;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "config:database";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Update the Database configuration.";

    /**
     * @private
     * @type {string[]}
     * @memberof Command
     */
    private readonly validFlags: string[] = ["host", "port", "database", "username", "password"];

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
            .setFlag("host", "The host address of the database.", Joi.string())
            .setFlag("port", "The port of the database.", Joi.number())
            .setFlag("database", "The name of the database.", Joi.string())
            .setFlag("username", "The name of the database user.", Joi.string())
            .setFlag("password", "The password of the database user.", Joi.string());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const envFile = this.app.getCorePath("config", ".env");

        if (this.validFlags.some((flag: string) => this.hasFlag(flag))) {
            this.environment.updateVariables(envFile, this.confirm(this.getFlags()));

            return;
        }

        const response = await this.components.prompt([
            {
                type: "text",
                name: "host",
                message: "What host do you want to use?",
                initial: "localhost",
            },
            {
                type: "text",
                name: "port",
                message: "What port do you want to use?",
                initial: 5432,
                validate: /* istanbul ignore next */ (value) =>
                    value < 1 || value > 65535 ? `The port must be in the range of 1-65535.` : true,
            },
            {
                type: "text",
                name: "database",
                message: "What database do you want to use?",
                initial: `${this.getFlag("token")}_${this.getFlag("network")}`,
            },
            {
                type: "text",
                name: "username",
                message: "What username do you want to use?",
                initial: this.getFlag("token"),
            },
            {
                type: "password",
                name: "password",
                message: "What password do you want to use?",
                initial: "password",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.confirm) {
            this.components.fatal("You'll need to confirm the input to continue.");
        }

        this.environment.updateVariables(envFile, this.confirm(response));
    }

    /**
     * @private
     * @param {Contracts.AnyObject} flags
     * @returns {Contracts.AnyObject}
     * @memberof Command
     */
    private confirm(flags: Contracts.AnyObject): Contracts.AnyObject {
        const variables: Contracts.AnyObject = {};

        for (const option of this.validFlags) {
            if (flags[option] !== undefined) {
                variables[`CORE_DB_${option.toUpperCase()}`] = flags[option];
            }
        }

        return variables;
    }
}
