import { app } from "@arkecosystem/core-container";
import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export const isAppReady = (): {
    transactionPool: boolean;
    blockchain: boolean;
    p2p: boolean;
} => {
    return {
        transactionPool: !!app.resolvePlugin("transaction-pool"),
        blockchain: !!app.resolvePlugin("blockchain"),
        p2p: !!app.resolvePlugin("p2p"),
    };
};

export const getHandlers = (): { [key: string]: string[] } => {
    return {
        peer: Object.keys(peerHandlers),
        internal: Object.keys(internalHandlers),
    };
};

export const log = ({ req }): void => {
    app.resolvePlugin("logger")[req.data.level](req.data.message);
};

export const isForgerAuthorized = ({ req }): { authorized: boolean } => {
    return { authorized: isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.data.ip) };
};

export const getConfig = (): Record<string, any> => {
    const config = app.resolveOptions("p2p");

    // add maxTransactionsPerRequest config from transaction pool
    config.maxTransactionsPerRequest = app.has("transaction-pool")
        ? app.resolveOptions("transaction-pool").maxTransactionsPerRequest || 40
        : 40;

    return config;
};
