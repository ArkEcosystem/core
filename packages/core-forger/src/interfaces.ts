import { SCClientSocket } from "socketcluster-client";

export interface RelayHost {
    hostname: string;
    port: number;
    socket?: SCClientSocket;
}
