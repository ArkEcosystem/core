import { CronJob as Cron } from "cron";

import { injectable } from "../../container";
import { Job } from "./interfaces";

/**
 * @remarks
 * {@link https://crontab.guru/ | crontab guru}
 * {@link https://github.com/kelektiv/node-cron | node-cron}
 *
 * @export
 * @class CronJob
 * @implements {Job}
 */
@injectable()
export class CronJob implements Job {
    /**
     * @private
     * @type {string}
     * @memberof CronJob
     */
    protected expression = "* * * * *";

    /**
     * @param {Function} callback
     * @memberof CronJob
     */
    public execute(callback: Function): void {
        new Cron(this.expression, callback).start();
    }

    /**
     * The Cron expression representing the job's frequency.
     *
     * @param {string} expression
     * @returns {this}
     * @memberof CronJob
     */
    public cron(expression: string): this {
        this.expression = expression;

        return this;
    }

    /**
     * Schedule the job to run every minute.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public everyMinute(): this {
        return this.setMinute("*");
    }

    /**
     * Schedule the job to run every five minutes.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public everyFiveMinutes(): this {
        return this.setMinute("*/5");
    }

    /**
     * Schedule the job to run every ten minutes.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public everyTenMinutes(): this {
        return this.setMinute("*/10");
    }

    /**
     * Schedule the job to run every fifteen minutes.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public everyFifteenMinutes(): this {
        return this.setMinute("*/15");
    }

    /**
     * Schedule the job to run every thirty minutes.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public everyThirtyMinutes(): this {
        return this.setMinute("*/30");
    }

    /**
     * Schedule the job to run hourly.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public hourly(): this {
        return this.setMinute("0");
    }

    /**
     * Schedule the job to run hourly at a given offset in the hour.
     *
     * @param {string} minute
     * @returns {this}
     * @memberof CronJob
     */
    public hourlyAt(minute: string): this {
        return this.setMinute(minute);
    }

    /**
     * Schedule the job to run daily.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public daily(): this {
        return this.setMinute("0").setHour("0");
    }

    /**
     * Schedule the job to run daily at a given time (10:00, 19:30, etc).
     *
     * @param {string} hour
     * @param {string} minute
     * @returns {this}
     * @memberof CronJob
     */
    public dailyAt(hour: string, minute: string): this {
        return this.setMinute(minute).setHour(hour);
    }

    /**
     * Schedule the job to run only on weekdays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public weekdays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("1-5");
    }

    /**
     * Schedule the job to run only on weekends.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public weekends(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("6,0");
    }

    /**
     * Schedule the job to run only on Mondays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public mondays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("MON");
    }

    /**
     * Schedule the job to run only on Tuesdays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public tuesdays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("TUE");
    }

    /**
     * Schedule the job to run only on Wednesdays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public wednesdays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("WED");
    }

    /**
     * Schedule the job to run only on Thursdays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public thursdays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("THU");
    }

    /**
     * Schedule the job to run only on Fridays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public fridays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("FRI");
    }

    /**
     * Schedule the job to run only on Saturdays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public saturdays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("SAT");
    }

    /**
     * Schedule the job to run only on Sundays.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public sundays(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("SUN");
    }

    /**
     * Schedule the job to run weekly.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public weekly(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayWeek("0");
    }

    /**
     * Schedule the job to run weekly on a given day and time.
     *
     * @param {string} day
     * @param {string} hour
     * @param {string} minute
     * @returns {this}
     * @memberof CronJob
     */
    public weeklyOn(day: string, hour: string, minute: string): this {
        return this.setMinute(minute)
            .setHour(hour)
            .setDayWeek(day);
    }

    /**
     * Schedule the job to run monthly.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public monthly(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayMonth("1");
    }

    /**
     * Schedule the job to run monthly on a given day and time.
     *
     * @param {string} day
     * @param {string} hour
     * @param {string} minute
     * @returns {this}
     * @memberof CronJob
     */
    public monthlyOn(day: string, hour: string, minute: string): this {
        return this.setMinute(minute)
            .setHour(hour)
            .setDayMonth(day);
    }

    /**
     * Schedule the job to run quarterly.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public quarterly(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayMonth("1")
            .setMonth("*/3");
    }

    /**
     * Schedule the job to run yearly.
     *
     * @returns {this}
     * @memberof CronJob
     */
    public yearly(): this {
        return this.setMinute("0")
            .setHour("0")
            .setDayMonth("1")
            .setMonth("1");
    }

    /**
     * @private
     * @param {string} value
     * @returns {this}
     * @memberof CronJob
     */
    private setMinute(value: string): this {
        return this.spliceIntoPosition(0, value);
    }

    /**
     * @private
     * @param {string} value
     * @returns {this}
     * @memberof CronJob
     */
    private setHour(value: string): this {
        return this.spliceIntoPosition(1, value);
    }

    /**
     * @private
     * @param {string} value
     * @returns {this}
     * @memberof CronJob
     */
    private setDayMonth(value: string): this {
        return this.spliceIntoPosition(2, value);
    }

    /**
     * @private
     * @param {string} value
     * @returns {this}
     * @memberof CronJob
     */
    private setMonth(value: string): this {
        return this.spliceIntoPosition(3, value);
    }

    /**
     * @private
     * @param {string} value
     * @returns {this}
     * @memberof CronJob
     */
    private setDayWeek(value: string): this {
        return this.spliceIntoPosition(4, value);
    }

    /**
     * Splice the given value into the given position of the expression.
     *
     * @private
     * @param {number} position
     * @param {string} value
     * @returns {this}
     * @memberof CronJob
     */
    private spliceIntoPosition(position: number, value: string): this {
        const segments: string[] = this.expression.split(" ");
        segments[position] = value;

        return this.cron(segments.join(" "));
    }
}
