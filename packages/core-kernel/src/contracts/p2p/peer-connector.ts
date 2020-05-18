// todo: we need to get rid of this dependency as it is big and doesn't concern core-kernel
import Nes from "@hapi/nes";

import { Peer } from "./peer";

export interface PeerConnector {
    all(): Nes.Client[];

    connection(peer: Peer): Nes.Client | undefined;

    connect(peer: Peer, maxPayload?: number): Promise<Nes.Client>;

    disconnect(peer: Peer): void;

    emit(peer: Peer, event: string, payload: any): Promise<any>;

    getError(peer: Peer): string | undefined;

    setError(peer: Peer, error: string): void;

    hasError(peer: Peer, error: string): boolean;

    forgetError(peer: Peer): void;
}
