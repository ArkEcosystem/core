import { SCClientSocket } from "socketcluster-client";
import { IPeer } from "./peer";

export interface IPeerConnector {
    all(): SCClientSocket[];
    connection(peer: IPeer): SCClientSocket;

    connect(peer: IPeer): SCClientSocket;
    disconnect(peer: IPeer): void;

    emit(peer: IPeer, event: string, data: any): void;
    getError(peer: IPeer): string;
    setError(peer: IPeer, error: Error): void;
    hasError(peer: IPeer, error: string): boolean;
    forgetError(peer: IPeer): void;
}
