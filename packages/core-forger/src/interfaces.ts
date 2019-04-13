import { SCClientSocket } from "socketcluster-client";

export interface IRelayHost {
    port: number;
    ip: string;
    socket?: SCClientSocket;
}
