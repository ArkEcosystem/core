import { app } from "@arkecosystem/core-kernel";
import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export const isAppReady = (): {
    transactionPool: boolean;
    blockchain: boolean;
    p2p: boolean;
} => {
    return {
        transactionPool: !!app.resolve("transaction-pool"),
        blockchain: !!app.resolve("blockchain"),
        p2p: !!app.resolve("p2p"),
    };
};

export const getHandlers = (): { [key: string]: string[] } => {
    return {
        peer: Object.keys(peerHandlers),
        internal: Object.keys(internalHandlers),
    };
};

export const log = ({ req }): void => {
    app.resolve("logger")[req.data.level](req.data.message);
};

export const isForgerAuthorized = ({ req }): { authorized: boolean } => {
    return { authorized: isWhitelisted(app.resolve("p2p.options").remoteAccess, req.data.ip) };
};

export const getConfig = (): Record<string, any> => {
    return app.resolve("p2p.options");
};
