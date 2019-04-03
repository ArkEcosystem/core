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
