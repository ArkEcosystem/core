import { app } from "@arkecosystem/core-container";
import { isWhitelisted } from "../../../utils/is-whitelisted";

export const getHandlers = () => {
    const peerHandlers = require("../peer");
    const internalHandlers = require("../internal");

    return {
        peer: Object.keys(peerHandlers),
        internal: Object.keys(internalHandlers),
    };
};

export const isForgerAuthorized = req => {
    const config = require("../../../config");

    return isWhitelisted(config.remoteAccess, req.data.ip);
};

export const isAppReady = () => {
    const p2p = app.resolvePlugin("p2p");
    return {
        transactionPool: !!app.resolvePlugin("transactionPool"),
        blockchain: !!app.resolvePlugin("blockchain"),
        p2p: !!p2p && !!p2p.guard,
    };
};
