import { app, Container } from "@arkecosystem/core-kernel";

import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export const isAppReady = (): { ready: boolean } => {
    return {
        ready:
            !!app.resolvePlugin("transaction-pool") && !!app.resolvePlugin("blockchain") && !!app.resolvePlugin("p2p"),
    };
};

export const getHandlers = (): { [key: string]: string[] } => ({
    peer: Object.keys(peerHandlers),
    internal: Object.keys(internalHandlers),
});

export const log = ({ req }): void => app.log[req.data.level](req.data.message);

export const isForgerAuthorized = ({ req }): { authorized: boolean } => ({
    authorized: isWhitelisted(app.get<any>("p2p.options").remoteAccess, req.data.ip),
});

export const getConfig = (): Record<string, any> => app.get<any>("p2p.options");
