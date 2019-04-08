import { SCClientSocket } from "socketcluster-client";
import { IPeer } from "./peer";

export interface IPeerConnector {
    all(): SCClientSocket[];
    connection(peer: IPeer): SCClientSocket;
    ensureConnection(peer: IPeer): SCClientSocket;
    connect(peer: IPeer): SCClientSocket;
    disconnect(peer: IPeer): void;
    emit(peer: IPeer, event: string, data: any): void;
}
