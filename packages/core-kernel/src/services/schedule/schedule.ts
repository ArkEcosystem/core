import { CronJob } from "./cron-job";
import { BlockJob } from "./block-job";
import { injectable, inject } from "../../container";
import { IApplication } from "../../contracts/kernel";

/**
 * @export
 * @class Schedule
 */
@injectable()
export class Schedule {
    /**
     * @private
     * @type {IApplication}
     * @memberof BlockJob
     */
    @inject("app")
    private readonly app: IApplication;

    /**
     * @returns {CronJob}
     * @memberof Schedule
     */
    public cron(): CronJob {
        return this.app.ioc.resolve<CronJob>(CronJob);
    }

    /**
     * @returns {BlockJob}
     * @memberof Schedule
     */
    public block(): BlockJob {
        return this.app.ioc.resolve<BlockJob>(BlockJob);
    }
}
