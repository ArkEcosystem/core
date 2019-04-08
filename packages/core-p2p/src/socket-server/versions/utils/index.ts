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

export const logInfo = req => {
    const logger = app.resolvePlugin("logger");
    if (logger) {
        logger.info(req.data.message);
    }
};

export const logError = req => {
    const logger = app.resolvePlugin("logger");
    if (logger) {
        logger.error(req.data.message);
    }
};

export const isForgerAuthorized = req => {
    return isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.data.ip);
};

export const isAppReady = () => {
    const p2p = app.resolvePlugin("p2p");
    return {
        transactionPool: !!app.resolvePlugin("transaction-pool"),
        blockchain: !!app.resolvePlugin("blockchain"),
        p2p: !!p2p && !!p2p.guard,
    };
};
