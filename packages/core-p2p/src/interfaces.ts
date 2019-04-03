import { P2P } from "@arkecosystem/core-interfaces";
import { Dato } from "@faustbrian/dato";

export interface IAcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface IOffence {
    number: number;
    period: string;
    reason: string;
    weight: number;
    critical?: boolean;
}

export interface IPunishment {
    until: Dato;
    reason: string;
    weight: number;
}

export interface ISuspensionList {
    [ip: string]: P2P.ISuspension;
}
