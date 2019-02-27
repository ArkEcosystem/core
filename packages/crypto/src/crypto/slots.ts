import { Dato } from "@arkecosystem/utils";
import { configManager } from "../managers";

class Slots {
    public height: number;
    /**
     * Create a new Slot instance.
     */
    constructor() {
        this.resetHeight();
    }

    /**
     * Get the height we are currently at.
     */
    public getHeight(): number {
        return this.height;
    }

    /**
     * Set the height we are currently at.
     */
    public setHeight(height: number): void {
        this.height = height;
    }

    /**
     * Reset the height to the initial value.
     */
    public resetHeight(): void {
        this.height = 1;
    }

    /**
     * Get epoch time relative to beginning epoch time.
     */
    public getEpochTime(time?: number): number {
        if (time === undefined) {
            time = Dato.now().toMilliseconds();
        }

        const start = this.beginEpochTime().toMilliseconds();

        return Math.floor((time - start) / 1000);
    }

    /**
     * Get beginning epoch time.
     */
    public beginEpochTime(): Dato {
        return Dato.fromString(this.getMilestone("epoch"));
    }

    /**
     * Get epoch time relative to beginning epoch time.
     */
    public getTime(time?: number): number {
        return this.getEpochTime(time);
    }

    /**
     * Get real time from relative epoch time.
     */
    public getRealTime(epochTime?: number): number {
        if (epochTime === undefined) {
            epochTime = this.getTime();
        }

        const start = Math.floor(this.beginEpochTime().toMilliseconds() / 1000) * 1000;

        return start + epochTime * 1000;
    }

    /**
     * Time left until next slot.
     */
    public getTimeInMsUntilNextSlot(): number {
        const nextSlotTime = this.getSlotTime(this.getNextSlot());
        const now = this.getTime();
        return (nextSlotTime - now) * 1000;
    }

    /**
     * Get the current slot number.
     */
    public getSlotNumber(epochTime?: number): number {
        if (epochTime === undefined) {
            epochTime = this.getTime();
        }

        return Math.floor(epochTime / this.getMilestone("blocktime"));
    }

    /**
     * Get the current slot time.
     */
    public getSlotTime(slot: number): number {
        return slot * this.getMilestone("blocktime");
    }

    /**
     * Get the next slot number.
     */
    public getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    /**
     * Get the last slot number.
     */
    public getLastSlot(nextSlot: number): number {
        return nextSlot + this.getMilestone("activeDelegates");
    }

    /**
     * Checks if forging is allowed
     */
    public isForgingAllowed(epochTime?: number): boolean {
        if (epochTime === undefined) {
            epochTime = this.getTime();
        }

        const blockTime = this.getMilestone("blocktime");

        return epochTime % blockTime < blockTime / 2;
    }

    /**
     * Get constant from height 1.
     */
    private getMilestone(key: string): any {
        return configManager.getMilestone(this.height)[key];
    }
}

export const slots = new Slots();
