import { P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { NetworkStateStatus } from "./enums";
export declare class NetworkState implements P2P.INetworkState {
    readonly status: NetworkStateStatus;
    nodeHeight: number;
    lastBlockId: string;
    private quorumDetails;
    constructor(status: NetworkStateStatus, lastBlock?: Interfaces.IBlock);
    setLastBlock(lastBlock: Interfaces.IBlock): void;
    static analyze(monitor: P2P.INetworkMonitor, storage: P2P.IPeerStorage): P2P.INetworkState;
    static parse(data: any): P2P.INetworkState;
    getQuorum(): number;
    getOverHeightBlockHeaders(): {
        [id: string]: any;
    };
    toJson(): string;
    private static analyzeNetwork;
    private update;
}
