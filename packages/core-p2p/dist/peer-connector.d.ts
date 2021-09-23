import { P2P } from "@arkecosystem/core-interfaces";
import { SCClientSocket } from "socketcluster-client";
export declare class PeerConnector implements P2P.IPeerConnector {
    private readonly connections;
    private readonly errors;
    all(): SCClientSocket[];
    connection(peer: P2P.IPeer): SCClientSocket;
    connect(peer: P2P.IPeer, maxPayload?: number): SCClientSocket;
    disconnect(peer: P2P.IPeer): void;
    terminate(peer: P2P.IPeer): void;
    emit(peer: P2P.IPeer, event: string, data: any): void;
    getError(peer: P2P.IPeer): string;
    setError(peer: P2P.IPeer, error: string): void;
    hasError(peer: P2P.IPeer, error: string): boolean;
    forgetError(peer: P2P.IPeer): void;
    private create;
}
