import { Dato } from "@faustbrian/dato";
import { IPeer } from "./peer";

export interface IPeerGuard {
    punishment(offence: string): IPunishment;
    analyze(peer: IPeer): IPunishment;
    isWhitelisted(peer: IPeer): boolean;
    isValidVersion(peer: IPeer): boolean;
    isValidNetwork(peer: IPeer): boolean;
    isValidPort(peer: IPeer): boolean;
}

export interface IPeerSuspension {
    readonly peer: IPeer;
    readonly punishment: IPunishment;

    nextReminder?: Dato;

    isLow(): boolean;
    isMedium(): boolean;
    isHigh(): boolean;
    isCritical(): boolean;

    hasExpired(): boolean;
}

export interface IOffence {
    until: () => Dato;
    reason: string;
    severity?: "low" | "medium" | "high" | "critical";
}

export interface IPunishment {
    until: Dato;
    reason: string;
    severity?: "low" | "medium" | "high" | "critical";
}
