import { CronJob as Job } from "cron";
import { CronFrequencies } from "./cron-frequencies";

/**
 * @export
 * @class CronJob
 */
export class CronJob extends CronFrequencies {
    /**
     * @private
     * @memberof CronJob
     */
    private job: CronJob;

    /**
     * @private
     * @memberof CronJob
     */
    private onTick: () => void;

    /**
     * @private
     * @memberof CronJob
     */
    private onComplete: () => void;

    /**
     * @param {() => void} callback
     * @memberof CronJob
     */
    public call(callback: () => void): void {
        this.onTick = callback;
    }

    /**
     * @param {() => void} callback
     * @memberof CronJob
     */
    public whenCompleted(callback: () => void): void {
        this.onComplete = callback;
    }

    /**
     * @memberof CronJob
     */
    public start(): void {
        this.job = new Job(this.expression, this.onTick, this.onComplete);
        this.job.start();
    }

    /**
     * @memberof CronJob
     */
    public stop(): void {
        this.job.stop();
    }
}
