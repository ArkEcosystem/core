import { SCClientSocket } from "socketcluster-client";

import { Peer } from "./peer";

export interface PeerConnector {
    all(): SCClientSocket[];
    connection(peer: Peer): SCClientSocket;

    connect(peer: Peer): SCClientSocket;
    disconnect(peer: Peer): void;

    emit(peer: Peer, event: string, data: any): void;

    getError(peer: Peer): string | undefined;
    setError(peer: Peer, error: string): void;
    hasError(peer: Peer, error: string): boolean;
    forgetError(peer: Peer): void;
}
