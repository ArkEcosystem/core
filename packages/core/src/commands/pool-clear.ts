import { Commands, Container } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";
import { removeSync } from "fs-extra";

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
    public signature: string = "pool:clear";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Clear the transaction pool.";

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
        this.actions.abortRunningProcess(`${this.getFlag("token")}-core`);
        this.actions.abortRunningProcess(`${this.getFlag("token")}-forger`);
        this.actions.abortRunningProcess(`${this.getFlag("token")}-relay`);

        if (this.getFlag("false")) {
            return this.removeFiles();
        }

        try {
            if (
                await this.components.confirm(
                    "Clearing the transaction pool will remove all queued transactions from your node. Are you sure you want to clear?",
                )
            ) {
                this.removeFiles();
            }
        } catch (err) {
            this.components.fatal(err.message);
        }
    }

    /**
     * @private
     * @memberof Command
     */
    private removeFiles() {
        removeSync(this.app.getCorePath("data", "transaction-pool"));
    }
}
