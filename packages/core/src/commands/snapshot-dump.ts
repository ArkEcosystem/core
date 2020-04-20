import { Commands, Container, Contracts, Services, Utils, Components } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";
import { Container as KernelContainer, Contracts as KernelContracts } from "@arkecosystem/core-kernel";
import { ProgressRenderer } from "../utils/snapshot-progress-renderer";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    @Container.inject(Container.Identifiers.Logger)
    private readonly logger!: Services.Logger;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "snapshot:dump";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Create a full snapshot of the database.";

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
            .setFlag("codec", "The name of the codec.", Joi.string())
            .setFlag("skipCompression", "Skip gzip compression.", Joi.boolean())
            .setFlag("trace", "Dumps generated queries and settings to console.", Joi.boolean())
            .setFlag("blocks", "Blocks to append to, correlates to folder name.", Joi.boolean())
            .setFlag("start", "The start network height to export.", Joi.number().default(-1))
            .setFlag("end", "The end network height to export.", Joi.number().default(-1));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        // this.components.fatal("This command has not been implemented.");
        // TODO: abort running processes (core, forger, relay)

        const flags: Contracts.AnyObject = { ...this.getFlags() };
        flags.processType = "snapshot";

        let app = await Utils.buildApplication({
            flags,
        });

        if(!app.isBooted()) {
            this.logger.error("App is not booted.");
            return;
        }

        if(!app.isBound(KernelContainer.Identifiers.SnapshotService)) {
            this.logger.error("Snapshot service is not initialized.");
            return;
        }

        let spinner = this.app.get<Components.ComponentFactory>(Container.Identifiers.ComponentFactory).spinner();
        new ProgressRenderer(spinner, app);

        this.logger.error("Starting dump from cli.");

        await app.get<KernelContracts.Snapshot.SnapshotService>(KernelContainer.Identifiers.SnapshotService).dump(flags);
    }
}
