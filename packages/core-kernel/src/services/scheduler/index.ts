import { CronJob } from "cron";
import { Frequencies } from "./frequencies";

/**
 * @export
 * @class Schedule
 */
export class Schedule extends Frequencies {
    /**
     * @private
     * @memberof Schedule
     */
    private job: CronJob;

    /**
     * @private
     * @memberof Schedule
     */
    private onTick: () => void;

    /**
     * @private
     * @memberof Schedule
     */
    private onComplete: () => void;

    /**
     * @param {() => void} callback
     * @memberof Schedule
     */
    public call(callback: () => void): void {
        this.onTick = callback;
    }

    /**
     * @param {() => void} callback
     * @memberof Schedule
     */
    public whenCompleted(callback: () => void): void {
        this.onComplete = callback;
    }

    /**
     * @memberof Schedule
     */
    public start(): void {
        this.job = new CronJob(this.expression, this.onTick, this.onComplete);
        this.job.start();
    }

    /**
     * @memberof Schedule
     */
    public stop(): void {
        this.job.stop();
    }
}
