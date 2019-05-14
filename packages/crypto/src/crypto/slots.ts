import { dato } from "@faustbrian/dato";
import { configManager } from "../managers";

export class Slots {
    public static getTime(time?: number): number {
        if (time === undefined) {
            time = dato().toMilliseconds();
        }

        const start: number = dato(configManager.getMilestone(1).epoch).toMilliseconds();

        return Math.floor((time - start) / 1000);
    }

    public static getTimeInMsUntilNextSlot(): number {
        const nextSlotTime: number = this.getSlotTime(this.getNextSlot());
        const now: number = this.getTime();

        return (nextSlotTime - now) * 1000;
    }

    public static getSlotNumber(epoch?: number): number {
        if (epoch === undefined) {
            epoch = this.getTime();
        }

        return Math.floor(epoch / configManager.getMilestone(1).blocktime);
    }

    public static getSlotTime(slot: number): number {
        return slot * configManager.getMilestone(1).blocktime;
    }

    public static getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    public static isForgingAllowed(epoch?: number): boolean {
        if (epoch === undefined) {
            epoch = this.getTime();
        }

        const blockTime: number = configManager.getMilestone(1).blocktime;

        return epoch % blockTime < blockTime / 2;
    }
}
