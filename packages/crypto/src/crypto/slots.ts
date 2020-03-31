import dayjs from "dayjs";

import { configManager } from "../managers";
import { calculateBlockTime } from "../utils/block-time-calculator";

export class Slots {
    public static getTime(time?: number): number {
        if (time === undefined) {
            time = dayjs().valueOf();
        }

        const start: number = dayjs(configManager.getMilestone(1).epoch).valueOf();

        return Math.floor((time - start) / 1000);
    }

    public static getTimeInMsUntilNextSlot(): number {
        const nextSlotTime: number = this.getSlotTime(this.getNextSlot());
        const now: number = this.getTime();

        return (nextSlotTime - now) * 1000;
    }

    public static getSlotNumber(epoch?: number, height?: number): number {
        if (epoch === undefined) {
            epoch = this.getTime();
        }

        const lastKnownHeight = this.getHeight(height);
        const totalBlockTime = this.calculateTotalBlockTime(lastKnownHeight);

        return Math.floor(epoch / totalBlockTime);
    }

    public static getSlotTime(slot: number, height?: number): number {
        const lastKnownHeight = this.getHeight(height);
        return slot * calculateBlockTime(lastKnownHeight);
    }

    public static getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    public static isForgingAllowed(epoch?: number, height?: number): boolean {
        if (epoch === undefined) {
            epoch = this.getTime();
        }

        const lastKnownHeight = this.getHeight(height);
        const blockTime: number = calculateBlockTime(lastKnownHeight);

        return epoch % blockTime < blockTime / 2;
    }

    private static calculateTotalBlockTime(height: number): number {
        // TODO: calculate totals with varying blocktimes (across different milestones)
        return calculateBlockTime(height);
    }

    private static getHeight(height: number | undefined): number {
        if (!height) {
            // TODO: is the config manager the best way to retrieve most recent height?
            // Or should this class also have a cached list of seen heights?
            const configConfiguredHeight = configManager.getHeight();
            if (configConfiguredHeight) {
                return configConfiguredHeight;
            }
        }

        return 1;
    }
}
