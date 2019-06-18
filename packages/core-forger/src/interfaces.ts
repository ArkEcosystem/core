import { SCClientSocket } from "socketcluster-client";

export interface IRelayHost {
    hostname: string;
    port: number;
    socket?: SCClientSocket;
}
