import { Commands, Container, Contracts, Services, Utils } from "@arkecosystem/core-cli";
import { Container as KernelContainer, Contracts as KernelContracts } from "@arkecosystem/core-kernel";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";

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
    public signature: string = "snapshot:rollback";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Rollback chain to specified height.";

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
            .setFlag("height", "The height after the roll back.", Joi.number())
            .setFlag("number", "The number of blocks to roll back.", Joi.number());
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

        const app = await Utils.buildApplication({
            flags,
        });

        if (flags.height) {
            await app
                .get<KernelContracts.Snapshot.SnapshotService>(KernelContainer.Identifiers.SnapshotService)
                .rollbackByHeight(flags.height);
        } else if (flags.number) {
            await app
                .get<KernelContracts.Snapshot.SnapshotService>(KernelContainer.Identifiers.SnapshotService)
                .rollbackByNumber(flags.number);
        } else {
            this.logger.error("Please specify either a height or number of blocks to roll back.");
        }

        await app.terminate();
    }
}
