import { app, Container } from "@arkecosystem/core-kernel";

import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export const isAppReady = (): {
    transactionPool: boolean;
    blockchain: boolean;
    p2p: boolean;
} => ({
    transactionPool: app.isBound(Container.Identifiers.TransactionPoolService),
    blockchain: app.isBound(Container.Identifiers.BlockchainService),
    p2p: app.isBound(Container.Identifiers.PeerNetworkMonitor),
});

export const getHandlers = (): { [key: string]: string[] } => ({
    peer: Object.keys(peerHandlers),
    internal: Object.keys(internalHandlers),
});

export const log = ({ req }): void => app.log[req.data.level](req.data.message);

export const isForgerAuthorized = ({ req }): { authorized: boolean } => ({
    authorized: isWhitelisted(app.get<any>("p2p.options").remoteAccess, req.data.ip),
});

export const getConfig = (): Record<string, any> => app.get<any>("p2p.options");
