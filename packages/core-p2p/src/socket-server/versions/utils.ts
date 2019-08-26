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
        transactionPool: !!app.isBound("transactionPool"),
        blockchain: !!app.isBound("blockchain"),
        p2p: !!app.isBound("p2p"),
    };
};

export const getHandlers = (): { [key: string]: string[] } => {
    return {
        peer: Object.keys(peerHandlers),
        internal: Object.keys(internalHandlers),
    };
};

export const log = ({ req }): void => {
    app.log[req.data.level](req.data.message);
};

export const isForgerAuthorized = ({ req }): { authorized: boolean } => {
    return { authorized: isWhitelisted(app.get<any>("p2p.options").remoteAccess, req.data.ip) };
};

export const getConfig = (): Record<string, any> => {
    return app.get<any>("p2p.options");
};
