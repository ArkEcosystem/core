import { Libraries } from "../interfaces/libraries";
import { MilestoneManager } from "../managers/milestone-manager";

export class Slots<T> {
    public constructor(private libraries: Libraries, private milestoneManager: MilestoneManager<T>) {}

    public getTime(time?: number): number {
        if (time === undefined) {
            time = this.libraries.dayjs().valueOf();
        }

        const start: number = this.libraries.dayjs(this.milestoneManager.getMilestone(1).epoch).valueOf();

        // @ts-ignore TODO: use assert here
        return Math.floor((time - start) / 1000);
    }

    public getTimeInMsUntilNextSlot(): number {
        const nextSlotTime: number = this.getSlotTime(this.getNextSlot());
        const now: number = this.getTime();

        return (nextSlotTime - now) * 1000;
    }

    public getSlotNumber(epoch?: number): number {
        if (epoch === undefined) {
            epoch = this.getTime();
        }

        return Math.floor(epoch / this.milestoneManager.getMilestone(1).blocktime);
    }

    public getSlotTime(slot: number): number {
        return slot * this.milestoneManager.getMilestone(1).blocktime;
    }

    public getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    public isForgingAllowed(epoch?: number): boolean {
        if (epoch === undefined) {
            epoch = this.getTime();
        }

        const blockTime: number = this.milestoneManager.getMilestone(1).blocktime;

        return epoch % blockTime < blockTime / 2;
    }
}
