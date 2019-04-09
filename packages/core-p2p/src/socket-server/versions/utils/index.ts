import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { config } from "../../../config";
import { isWhitelisted } from "../../../utils/is-whitelisted";

export const getHandlers = () => {
    return {
        peer: Object.keys(require("../peer")),
        internal: Object.keys(require("../internal")),
    };
};

export const logInfo = (service: P2P.IPeerService, req) => {
    const logger = app.resolvePlugin("logger");
    if (logger) {
        logger.info(req.data.message);
    }
};

export const logError = (service: P2P.IPeerService, req) => {
    if (app.has("logger")) {
        app.resolvePlugin("logger").error(req.data.message);
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
