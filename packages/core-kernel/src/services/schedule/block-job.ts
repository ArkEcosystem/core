import { EventDispatcher } from "../../contracts/kernel/events";
import { injectable, inject } from "../../container";
import { State } from "../../enums/events";
import { Job } from "./interfaces";
import { Interfaces, Managers } from "@arkecosystem/crypto";

/**
 * @export
 * @class BlockJob
 * @implements {Job}
 */
@injectable()
export class BlockJob implements Job {
    /**
     * @private
     * @type {EventDispatcher}
     * @memberof BlockJob
     */
    @inject("events")
    private readonly events: EventDispatcher;

    /**
     * @private
     * @type {number}
     * @memberof BlockJob
     */
    protected blockCount = 1;

    /**
     * @param {() => void} callback
     * @memberof BlockJob
     */
    public execute(callback: () => void): void {
        this.events.listen(State.BlockReceived, async ({ data }: { data: Interfaces.IBlockData }) => {
            if (data.height % this.blockCount === 0) {
                await callback();
            }
        });
    }

    /**
     * The number of blocks representing the job's frequency.
     *
     * @param {number} blockCount
     * @returns {this}
     * @memberof BlockJob
     */
    public cron(blockCount: number): this {
        this.blockCount = blockCount;

        return this;
    }

    /**
     * Schedule the job to run every block.
     *
     * @returns {this}
     * @memberof BlockJob
     */
    public everyBlock(): this {
        return this.cron(1);
    }

    /**
     * Schedule the job to run every five blocks.
     *
     * @returns {this}
     * @memberof BlockJob
     */
    public everyFiveBlocks(): this {
        return this.cron(5);
    }

    /**
     * Schedule the job to run every ten blocks.
     *
     * @returns {this}
     * @memberof BlockJob
     */
    public everyTenBlocks(): this {
        return this.cron(10);
    }

    /**
     * Schedule the job to run every fifteen blocks.
     *
     * @returns {this}
     * @memberof BlockJob
     */
    public everyFifteenBlocks(): this {
        return this.cron(15);
    }

    /**
     * Schedule the job to run every thirty blocks.
     *
     * @returns {this}
     * @memberof BlockJob
     */
    public everyThirtyBlocks(): this {
        return this.cron(30);
    }

    /**
     * Schedule the job to run every round.
     *
     * @returns {this}
     * @memberof BlockJob
     */
    public everyRound(): this {
        return this.cron(Managers.configManager.getMilestone().activeDelegates);
    }
}
