import { Types } from "@arkecosystem/crypto";
declare class Network {
    private options;
    private peerDiscovery;
    init(options: {
        network: Types.NetworkName;
        peer: string;
        maxLatency: number;
        peerPort: number;
    }): Promise<void>;
    sendGET({ path, query }: {
        path: string;
        query?: Record<string, any>;
    }): Promise<any>;
    sendPOST({ path, body }: {
        path: string;
        body: Record<string, any>;
    }): Promise<any>;
    getHeight(): Promise<number>;
    private checkForAip11Enabled;
    private sendRequest;
    private getPeer;
    private getPeers;
}
export declare const network: Network;
export {};
