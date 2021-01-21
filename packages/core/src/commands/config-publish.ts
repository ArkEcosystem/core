import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";
import { copySync, ensureDirSync, existsSync, removeSync } from "fs-extra";
import { resolve } from "path";

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
    public signature: string = "config:publish";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Publish the configuration.";

    /**
     * Indicates whether the command requires a network to be present.
     *
     * @type {boolean}
     * @memberof Command
     */
    public requiresNetwork: boolean = false;

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
            .setFlag("reset", "Using the --reset flag will overwrite existing configuration.", Joi.boolean());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        if (this.hasFlag("network")) {
            return this.performPublishment(this.getFlags());
        }

        const response = await this.components.prompt([
            {
                type: "select",
                name: "network",
                message: "Please select which network you want to operate on",
                choices: Object.keys(Networks).map((network) => ({ title: network, value: network })),
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.network) {
            this.components.fatal("You'll need to select the network to continue.");
        }

        if (!response.confirm) {
            this.components.fatal("You'll need to confirm the network to continue.");
        }

        await this.performPublishment({ ...response, ...this.getFlags() });
    }

    /**
     * @private
     * @param {Contracts.AnyObject} flags
     * @returns {Promise<void>}
     * @memberof Command
     */
    private async performPublishment(flags: Contracts.AnyObject): Promise<void> {
        this.app
            .rebind(Container.Identifiers.ApplicationPaths)
            .toConstantValue(this.environment.getPaths(flags.token, flags.network));

        const configDest = this.app.getCorePath("config");
        const configSrc = resolve(__dirname, `../../bin/config/${flags.network}`);

        await this.components.taskList([
            {
                title: "Prepare directories",
                task: () => {
                    if (flags.reset) {
                        removeSync(configDest);
                    }

                    if (existsSync(configDest)) {
                        this.components.fatal("Please use the --reset flag if you wish to reset your configuration.");
                    }

                    if (!existsSync(configSrc)) {
                        this.components.fatal(`Couldn't find the core configuration files at ${configSrc}.`);
                    }

                    ensureDirSync(configDest);
                },
            },
            {
                title: "Publish environment",
                task: () => {
                    if (!existsSync(`${configSrc}/.env`)) {
                        this.components.fatal(`Couldn't find the environment file at ${configSrc}/.env.`);
                    }

                    copySync(`${configSrc}/.env`, `${configDest}/.env`);
                },
            },
            { title: "Publish configuration", task: () => copySync(configSrc, configDest) },
        ]);
    }
}
