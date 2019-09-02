import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { BlockJob } from "./block-job";
import { CronJob } from "./cron-job";

/**
 * @export
 * @class Schedule
 */
@injectable()
export class Schedule {
    /**
     * @private
     * @type {Application}
     * @memberof BlockJob
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @returns {CronJob}
     * @memberof Schedule
     */
    public cron(): CronJob {
        return this.app.resolve<CronJob>(CronJob);
    }

    /**
     * @returns {BlockJob}
     * @memberof Schedule
     */
    public block(): BlockJob {
        return this.app.resolve<BlockJob>(BlockJob);
    }
}
