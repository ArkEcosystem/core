import { SCClientSocket } from "socketcluster-client";
export declare const socketEmit: (host: string, socket: SCClientSocket, event: string, data: any, headers: Record<string, any>, timeout?: number) => Promise<any>;
