import { app } from "@arkecosystem/core-container";
import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export function getHandlers() {
    return {
        peer: Object.keys(peerHandlers),
        internal: Object.keys(internalHandlers),
    };
}

export function log({ req }) {
    app.resolvePlugin("logger")[req.data.level](req.data.message);
}

export function isForgerAuthorized({ req }) {
    return isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.data.ip);
}

export function isAppReady() {
    return {
        transactionPool: !!app.resolvePlugin("transaction-pool"),
        blockchain: !!app.resolvePlugin("blockchain"),
        p2p: !!app.resolvePlugin("p2p"),
    };
}
