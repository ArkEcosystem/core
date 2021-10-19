import { Commands, Container, Contracts } from "@arkecosystem/core-cli";
import { Utils } from "@arkecosystem/core-kernel";
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
     * @type {Contracts.Updater}
     * @memberof Command
     */
    @Container.inject(Container.Identifiers.Updater)
    private readonly updater!: Contracts.Updater;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "update";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Update the Core installation.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("force", "Force an update.", Joi.boolean().default(false))
            .setFlag("updateProcessManager", "Update process manager.", Joi.boolean())
            .setFlag("restart", "Restart all running processes.", Joi.boolean())
            .setFlag("restartCore", "Restart the Core process.", Joi.boolean())
            .setFlag("restartRelay", "Restart the Relay process.", Joi.boolean())
            .setFlag("restartForger", "Restart the Forger process.", Joi.boolean());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const hasNewVersion: boolean = await this.updater.check();

        if (hasNewVersion) {
            await this.updater.update(this.getFlag("updateProcessManager"), this.getFlag("force"));

            if (this.hasRestartFlag()) {
                if (this.hasFlag("restart")) {
                    await this.actions.restartRunningProcess(`${this.getFlag("token")}-core`);
                    await this.actions.restartRunningProcess(`${this.getFlag("token")}-relay`);
                    await this.actions.restartRunningProcess(`${this.getFlag("token")}-forger`);
                } else {
                    if (this.hasFlag("restartCore")) {
                        await this.actions.restartRunningProcess(`${this.getFlag("token")}-core`);
                    }

                    if (this.hasFlag("restartRelay")) {
                        await this.actions.restartRunningProcess(`${this.getFlag("token")}-relay`);
                    }

                    if (this.hasFlag("restartForger")) {
                        await this.actions.restartRunningProcess(`${this.getFlag("token")}-forger`);
                    }
                }
            } else if (!this.getFlag("force")) {
                await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-core`);
                await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-relay`);
                await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-forger`);
            }
        } else {
            this.components.success(`You already have the latest version (${this.pkg.version})`);
        }
    }

    /**
     * @private
     * @returns {boolean}
     * @memberof Command
     */
    private hasRestartFlag(): boolean {
        return Utils.hasSomeProperty(this.getFlags(), ["restart", "restartCore", "restartRelay", "restartForger"]);
    }
}
