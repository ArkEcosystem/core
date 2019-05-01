import { app } from "@arkecosystem/core-container";
import { EventEmitter, P2P } from "@arkecosystem/core-interfaces";
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

export const suspendPeer = ({ req }: { req }): void => {
    app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit("internal.p2p.suspendPeer", {
        peer: req.data.remoteAddress,
        punishment: req.data.punishment,
    });
};

export const isSuspended = ({ service, req }: { service: P2P.IPeerService; req }): { suspended: boolean } => {
    return { suspended: service.getStorage().hasSuspendedPeer(req.data.remoteAccess) };
};

export const getConfig = (): Record<string, any> => {
    return app.resolveOptions("p2p");
};
