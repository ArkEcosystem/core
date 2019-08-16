import { Managers } from "@arkecosystem/crypto";

/**
 * @export
 * @class BlockFrequencies
 */
export class BlockFrequencies {
    /**
     * @private
     * @type {number}
     * @memberof BlockFrequencies
     */
    protected blockCount: number = 1;

    /**
     * The number of blocks representing the job's frequency.
     *
     * @param {number} blockCount
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public cron(blockCount: number): this {
        this.blockCount = blockCount;

        return this;
    }

    /**
     * Schedule the job to run every block.
     *
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public everyBlock(): this {
        return this.cron(1);
    }

    /**
     * Schedule the job to run every five blocks.
     *
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public everyFiveBlocks(): this {
        return this.cron(5);
    }

    /**
     * Schedule the job to run every ten blocks.
     *
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public everyTenBlocks(): this {
        return this.cron(10);
    }

    /**
     * Schedule the job to run every fifteen blocks.
     *
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public everyFifteenBlocks(): this {
        return this.cron(15);
    }

    /**
     * Schedule the job to run every thirty blocks.
     *
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public everyThirtyBlocks(): this {
        return this.cron(30);
    }

    /**
     * Schedule the job to run every round.
     *
     * @returns {this}
     * @memberof BlockFrequencies
     */
    public everyRound(): this {
        return this.cron(Managers.configManager.getMilestone().activeDelegates);
    }
}
