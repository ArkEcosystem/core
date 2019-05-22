import { Dayjs } from "dayjs";
import { IPeer } from "./peer";

export interface IPeerGuard {
    punishment(offence: string): IPunishment;
    analyze(peer: IPeer): IPunishment;
    isWhitelisted(peer: IPeer): boolean;
}

export interface IPeerSuspension {
    readonly peer: IPeer;
    readonly punishment: IPunishment;

    nextReminder?: Dayjs;

    isLow(): boolean;
    isMedium(): boolean;
    isHigh(): boolean;
    isCritical(): boolean;

    hasExpired(): boolean;
}

export interface IOffence {
    until: () => Dayjs;
    reason: string;
    severity?: "low" | "medium" | "high" | "critical";
}

export interface IPunishment {
    until: Dayjs;
    reason: string;
    severity?: "low" | "medium" | "high" | "critical";
}
