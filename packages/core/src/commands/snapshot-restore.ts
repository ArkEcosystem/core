import { Commands, Components, Container, Contracts, Services, Utils } from "@arkecosystem/core-cli";
import { Container as KernelContainer, Contracts as KernelContracts } from "@arkecosystem/core-kernel";
import { Networks } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import { ProgressRenderer } from "../utils/snapshot-progress-renderer";

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
    public signature: string = "snapshot:restore";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Import data from specified snapshot.";

    @Container.inject(Container.Identifiers.Logger)
    private readonly logger!: Services.Logger;

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
            // .setFlag("trace", "Dumps generated queries and settings to console.", Joi.boolean())
            .setFlag("blocks", "Blocks to import, correlates to folder name.", Joi.string())
            .setFlag("truncate", "Empty all tables before running import.", Joi.boolean())
            // .setFlag("skipRestartRound", "Skip revert to current round.", Joi.boolean())
            .setFlag("verify", "Verify signatures of specified snapshot.", Joi.boolean());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const flags: Contracts.AnyObject = { ...this.getFlags() };
        flags.processType = "snapshot";

        if (!this.getFlag("blocks")) {
            this.logger.error("Blocks flag is missing");
            return;
        }

        const app = await Utils.buildApplication({
            flags,
        });

        const spinner = this.app.get<Components.ComponentFactory>(Container.Identifiers.ComponentFactory).spinner();
        new ProgressRenderer(spinner, app);

        await app
            .get<KernelContracts.Snapshot.SnapshotService>(KernelContainer.Identifiers.SnapshotService)
            .restore(flags);

        await app.terminate();
    }
}
