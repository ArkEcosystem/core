import { dato, Dato } from "@faustbrian/dato";
import { configManager } from "../managers";

class Slots {
    /**
     * Get epoch time relative to beginning epoch time.
     */
    public getEpochTime(time?: number): number {
        if (time === undefined) {
            time = dato().toMilliseconds();
        }

        const start: number = this.beginEpochTime().toMilliseconds();

        return Math.floor((time - start) / 1000);
    }

    /**
     * Get beginning epoch time.
     */
    public beginEpochTime(): Dato {
        return dato(this.getMilestone("epoch"));
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

        const start: number = Math.floor(this.beginEpochTime().toMilliseconds() / 1000) * 1000;

        return start + epochTime * 1000;
    }

    /**
     * Time left until next slot.
     */
    public getTimeInMsUntilNextSlot(): number {
        const nextSlotTime: number = this.getSlotTime(this.getNextSlot());
        const now: number = this.getTime();

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
     * Checks if forging is allowed
     */
    public isForgingAllowed(epochTime?: number): boolean {
        if (epochTime === undefined) {
            epochTime = this.getTime();
        }

        const blockTime: number = this.getMilestone("blocktime");

        return epochTime % blockTime < blockTime / 2;
    }

    /**
     * Get constant from height 1.
     */
    private getMilestone(key: string): any {
        return configManager.getMilestone(1)[key];
    }
}

export const slots = new Slots();
