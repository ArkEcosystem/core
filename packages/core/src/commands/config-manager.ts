import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";

interface Options {
    host: string;
    port: number;
}

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
    public signature: string = "config:manager";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Update the Manager configuration.";

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
            .setFlag("host", "The host address of the manager.", Joi.string().default("0.0.0.0"))
            .setFlag("port", "The port of the manager.", Joi.number().default(4005));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        console.log(this.app.getCorePath("config", ".env"));

        const response = await this.components.prompt([
            {
                type: "text",
                name: "host",
                message: "What host do you want to use?",
                initial: "0.0.0.0",
            },
            {
                type: "number",
                name: "port",
                message: "What port do you want to use?",
                initial: 4005,
                validate: /* istanbul ignore next */ (value) =>
                    value < 1 || value > 65535 ? `The port must be in the range of 1-65535.` : true,
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.confirm) {
            throw new Error("You'll need to confirm the input to continue.");
        }

        // @ts-ignore
        this.updateEnvironmentVariables(response);
    }

    private updateEnvironmentVariables(options: Options): void {
        const variables: Contracts.AnyObject = {
            CORE_MONITOR_HOST: options.host,
            CORE_MONITOR_PORT: options.port,
        };

        const envFile = this.app.getCorePath("config", ".env");
        this.environment.updateVariables(envFile, variables);
    }
}
