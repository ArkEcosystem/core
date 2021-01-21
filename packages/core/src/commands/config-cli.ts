import { Commands, Container, Services } from "@arkecosystem/core-cli";
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
     * @type {Installer}
     * @memberof Command
     */
    @Container.inject(Container.Identifiers.Installer)
    private readonly installer!: Services.Installer;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "config:cli";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Update the CLI configuration.";

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
            .setFlag("token", "The name of the token.", Joi.string())
            .setFlag(
                "channel",
                "The NPM registry channel that should be used.",
                Joi.string().valid(...["next", "latest"]),
            );
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        if (this.hasFlag("token")) {
            this.config.set("token", this.getFlag("token"));
        }

        if (this.hasFlag("channel")) {
            const newChannel: string = this.getFlag("channel");
            const oldChannel: string = this.config.get("channel");

            if (oldChannel === newChannel) {
                this.components.fatal(`You are already on the "${newChannel}" channel.`);
            }

            this.config.set("channel", newChannel);

            const spinner = this.components.spinner(`Installing ${this.pkg.name}@${newChannel}`);

            spinner.start();

            this.installer.install(this.pkg.name!, newChannel);

            spinner.succeed();

            await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-core`);
            await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-relay`);
            await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-forger`);
        }
    }
}
