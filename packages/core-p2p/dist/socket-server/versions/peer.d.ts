import { Database, P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { IPeerPingResponse } from "../../interfaces";
export declare const getPeers: ({ service }: {
    service: P2P.IPeerService;
}) => P2P.IPeerBroadcast[];
export declare const getCommonBlocks: ({ req, }: {
    req: any;
}) => Promise<{
    common: Interfaces.IBlockData;
    lastBlockHeight: number;
}>;
export declare const getStatus: () => Promise<IPeerPingResponse>;
export declare const postBlock: ({ req }: {
    req: any;
}) => Promise<void>;
export declare const postTransactions: ({ service, req }: {
    service: P2P.IPeerService;
    req: any;
}) => Promise<string[]>;
export declare const getBlocks: ({ req }: {
    req: any;
}) => Promise<Interfaces.IBlockData[] | Database.IDownloadBlock[]>;
