// tslint:disable: no-empty-interface

import { models } from "@arkecosystem/crypto";
import { Dato } from "@faustbrian/dato";
import { SCClientSocket } from "socketcluster-client";
import { IDelegateWallet } from "../core-database";

export interface IPeerVerificationResult {
    readonly myHeight: number;
    readonly hisHeight: number;
    readonly highestCommonHeight: number;
    readonly forked: boolean;
}

export interface IAcceptNewPeerOptions {
    seed?: boolean;
    lessVerbose?: boolean;
}

export interface IPeerSuspension {
    readonly peer: any;
    readonly punishment: IPunishment;

    nextSuspensionReminder?: Dato;

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

export interface INetworkStatus {
    forked: boolean;
    blocksToRollback?: number;
}

export interface IPeerService {
    getStorage(): IPeerStorage;
    getProcessor(): IPeerProcessor;
    getConnector(): IPeerConnector;
    getCommunicator(): IPeerCommunicator;
    getMonitor(): INetworkMonitor;
    getGuard(): IPeerGuard;
}

export interface IPeerConnector {
    all(): SCClientSocket[];
    connection(peer: IPeer): SCClientSocket;
    ensureConnection(peer: IPeer): SCClientSocket;
    connect(peer: IPeer): SCClientSocket;
    disconnect(peer: IPeer): void;
    emit(peer: IPeer, event: string, data: any): void;
}

export interface IPeerProcessor {
    validateAndAcceptPeer(peer, options?: IAcceptNewPeerOptions): Promise<void>;
    validatePeer(peer, options?: IAcceptNewPeerOptions): boolean;
    acceptNewPeer(peer, options?: IAcceptNewPeerOptions): Promise<void>;
    suspend(peer: IPeer, punishment?: IPunishment): void;
    unsuspend(peer: IPeer): Promise<void>;
    isSuspended(peer: IPeer): boolean;
}

export interface INetworkMonitor {
    start(options): Promise<INetworkMonitor>;
    updateNetworkStatus(networkStart?: boolean): Promise<void>;
    cleanPeers(fast?: boolean, forcePing?: boolean): Promise<void>;
    discoverPeers(): Promise<void>;
    getNetworkHeight(): number;
    getPBFTForgingStatus(): number;
    getNetworkState(): Promise<INetworkState>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<INetworkStatus>;
    isColdStartActive(): boolean;
    syncWithNetwork(fromBlockHeight: number): Promise<any>;
    broadcastBlock(block): Promise<void>;
    broadcastTransactions(transactions): Promise<any>;
    getServer(): any;
    setServer(server: any): void;
    resetSuspendedPeers(): Promise<void>;
}

export interface IPeerCommunicator {
    ping(peer: IPeer, timeoutMsec: number, force?: boolean): Promise<any>;
    downloadBlocks(peer: IPeer, fromBlockHeight): Promise<any>;
    postBlock(peer: IPeer, block);
    postTransactions(peer: IPeer, transactions): Promise<any>;
    getPeers(peer: IPeer): Promise<any>;
    getPeerBlocks(peer: IPeer, afterBlockHeight: number, timeoutMsec?: number): Promise<any>;
    hasCommonBlocks(peer: IPeer, ids: string[], timeoutMsec?: number): Promise<any>;
}

export interface IPeerRepository<T> {
    all(): Map<string, T>;
    entries(): Array<[string, T]>;
    keys(): string[];
    values(): T[];

    pull(ip: string): T;
    get(ip: string): T;
    set(ip: string, peer: T): void;

    forget(ip: string): void;
    flush(): void;

    has(ip: string): boolean;
    missing(ip: string): boolean;
    count(): number;
    isEmpty(): boolean;
    isNotEmpty(): boolean;

    random(): T;

    toJson(): string;
}

export interface IPeer {
    readonly url: string;

    ip: string;
    port: number;

    nethash: string;
    version: string;
    os: string;

    delay: number;
    downloadSize: number;
    headers: Record<string, string | number>;
    state: any; // @TODO: add an interface/type
    lastPinged: Dato | null;
    verificationResult: IPeerVerificationResult | null;

    // @TODO: review and remove them where appropriate
    status: any;
    commonBlocks: any;
    socketError: any;

    setHeaders(headers: Record<string, string>): void;

    isVerified(): boolean;
    isForked(): boolean;
    recentlyPinged(): boolean;

    toBroadcast(): IPeerBroadcast;
}

export interface IPeerGuard {
    punishment(offence: string): IPunishment;
    analyze(peer: IPeer): IPunishment;
    isWhitelisted(peer: IPeer): boolean;
    isValidVersion(peer: IPeer): boolean;
    isValidNetwork(peer: IPeer): boolean;
    isValidPort(peer: IPeer): boolean;
}

export interface IPeerStorage {
    getPeers(): IPeer[];
    hasPeers(): boolean;
    getPeer(ip: string): IPeer;
    setPeer(peer: IPeer): void;
    forgetPeer(peer: IPeer): void;
    hasPeer(ip: string): boolean;

    getPendingPeers(): IPeer[];
    hasPendingPeers(): boolean;
    getPendingPeer(ip: string): IPeer;
    setPendingPeer(peer: IPeer): void;
    forgetPendingPeer(peer: IPeer): void;
    hasPendingPeer(ip: string): boolean;

    getSuspendedPeers(): IPeerSuspension[];
    hasSuspendedPeers(): boolean;
    getSuspendedPeer(ip: string): IPeerSuspension;
    setSuspendedPeer(suspension: IPeerSuspension): void;
    forgetSuspendedPeer(peer: IPeer): void;
    hasSuspendedPeer(ip: string): boolean;

    savePeers(): void;
}

export interface IResponse<T> {
    data: T;
}

export interface ICurrentRound {
    current: number;
    reward: string;
    timestamp: number;
    delegates: IDelegateWallet[];
    currentForger: IDelegateWallet;
    nextForger: IDelegateWallet;
    lastBlock: models.IBlockData;
    canForge: boolean;
}

export interface IForgingTransactions {
    transactions: string[];
    poolSize: number;
    count: number;
}

export interface IQuorumDetails {
    /**
     * Number of peers on same height, with same block and same slot. Used for
     * quorum calculation.
     */
    peersQuorum: number;

    /**
     * Number of peers which do not meet the quorum requirements. Used for
     * quorum calculation.
     */
    peersNoQuorum: number;

    /**
     * Number of overheight peers.
     */
    peersOverHeight: number;

    /**
     * All overheight block headers grouped by id.
     */
    peersOverHeightBlockHeaders: { [id: string]: any };

    /**
     * The following properties are not mutual exclusive for a peer
     * and imply a peer is on the same `nodeHeight`.
     */

    /**
     * Number of peers that are on a different chain (forked).
     */
    peersForked: number;

    /**
     * Number of peers with a different slot.
     */
    peersDifferentSlot: number;

    /**
     * Number of peers where forging is not allowed.
     */
    peersForgingNotAllowed: number;

    getQuorum(): number;
}

export interface INetworkState {
    readonly status: any;

    nodeHeight: number;
    lastBlockId: string;

    // static analyze(monitor: INetworkMonitor, storage: IPeerStorage): INetworkState;
    // static parse(data: any): INetworkState;

    setLastBlock(lastBlock);
    getQuorum();
    getOverHeightBlockHeaders();
    toJson();
}

export interface IPeerBroadcast {
    ip: string;
    port: number;
    nethash: string;
    version: string;
    os: string;
    height: number;
    delay: number;
}
