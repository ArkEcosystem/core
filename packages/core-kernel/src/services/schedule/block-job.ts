import { Managers } from "@arkecosystem/crypto";
import { performance } from "perf_hooks";

import { EventDispatcher } from "../../contracts/kernel/events";
import { BlockEvent, ScheduleEvent } from "../../enums";
import { Identifiers, inject, injectable } from "../../ioc";
import { Job } from "./interfaces";
import { ExecuteCallbackWhenReady } from "./listeners";

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
    @inject(Identifiers.EventDispatcherService)
    private readonly events!: EventDispatcher;

    /**
     * @private
     * @type {number}
     * @memberof BlockJob
     */
    protected blockCount: number = 1;

    /**
     * @param {Function} callback
     * @memberof BlockJob
     */
    public execute(callback: Function): void {
        const onCallback = async () => {
            const start = performance.now();

            await callback();

            await this.events.dispatch(ScheduleEvent.BlockJobFinished, {
                executionTime: performance.now() - start,
                blockCount: this.blockCount,
            });
        };

        this.events.listen(BlockEvent.Received, new ExecuteCallbackWhenReady(onCallback, this.blockCount));
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
