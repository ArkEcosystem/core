import { SCClientSocket } from "socketcluster-client";

export interface IRelaySocket {
    port: number;
    ip: string;
    socket: SCClientSocket;
}
