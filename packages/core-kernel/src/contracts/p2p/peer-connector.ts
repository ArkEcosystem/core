// todo: we need to get rid of this dependency as it is big and doesn't concern core-kernel
import { SCClientSocket } from "socketcluster-client";

import { Peer } from "./peer";

export interface PeerConnector {
    all(): SCClientSocket[];

    connection(peer: Peer): SCClientSocket;

    connect(peer: Peer, maxPayload?: number): SCClientSocket;

    disconnect(peer: Peer): void;

    terminate(peer: Peer): void;

    emit(peer: Peer, event: string, data: any): void;

    getError(peer: Peer): string | undefined;

    setError(peer: Peer, error: string): void;

    hasError(peer: Peer, error: string): boolean;

    forgetError(peer: Peer): void;
}
