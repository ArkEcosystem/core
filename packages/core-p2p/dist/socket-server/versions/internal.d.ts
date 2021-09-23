import { P2P } from "@arkecosystem/core-interfaces";
export declare const acceptNewPeer: ({ service, req }: {
    service: P2P.IPeerService;
    req: any;
}) => Promise<void>;
export declare const isPeerOrForger: ({ service, req }: {
    service: P2P.IPeerService;
    req: any;
}) => {
    isPeerOrForger: boolean;
};
export declare const emitEvent: ({ req }: {
    req: any;
}) => void;
export declare const getUnconfirmedTransactions: () => Promise<P2P.IUnconfirmedTransactions>;
export declare const getCurrentRound: () => Promise<P2P.ICurrentRound>;
export declare const getNetworkState: ({ service }: {
    service: P2P.IPeerService;
}) => Promise<P2P.INetworkState>;
export declare const getRateLimitStatus: ({ service, req, }: {
    service: P2P.IPeerService;
    req: {
        data: {
            ip: string;
            endpoint?: string;
        };
    };
}) => Promise<P2P.IRateLimitStatus>;
export declare const isBlockedByRateLimit: ({ service, req, }: {
    service: P2P.IPeerService;
    req: {
        data: {
            ip: string;
        };
    };
}) => Promise<{
    blocked: boolean;
}>;
export declare const syncBlockchain: () => void;
export declare const getRateLimitedEndpoints: ({ service }: {
    service: P2P.IPeerService;
}) => string[];
