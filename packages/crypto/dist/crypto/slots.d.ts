export declare class Slots {
    static getTime(time?: number): number;
    static getTimeInMsUntilNextSlot(): number;
    static getSlotNumber(epoch?: number): number;
    static getSlotTime(slot: number): number;
    static getNextSlot(): number;
    static isForgingAllowed(epoch?: number): boolean;
}
