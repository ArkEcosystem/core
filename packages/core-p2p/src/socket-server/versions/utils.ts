import { app } from "@arkecosystem/core-container";
import { EventEmitter, P2P } from "@arkecosystem/core-interfaces";
import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export function getHandlers(): { data: { [key: string]: string[] } } {
    return {
        data: {
            peer: Object.keys(peerHandlers),
            internal: Object.keys(internalHandlers),
        },
    };
}

export function log({ req }): void {
    app.resolvePlugin("logger")[req.data.level](req.data.message);
}

export function isForgerAuthorized({ req }): { data: { authorized: boolean } } {
    return {
        data: { authorized: isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.data.ip) },
    };
}

export function isAppReady(): {
    data: {
        transactionPool: boolean;
        blockchain: boolean;
        p2p: boolean;
    };
} {
    return {
        data: {
            transactionPool: !!app.resolvePlugin("transaction-pool"),
            blockchain: !!app.resolvePlugin("blockchain"),
            p2p: !!app.resolvePlugin("p2p"),
        },
    };
}

export function suspendPeer({ req }: { req }): void {
    app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter").emit("internal.p2p.suspendPeer", {
        peer: req.data.remoteAddress,
        punishment: req.data.punishment,
    });
}

export function isSuspended({ service, req }: { service: P2P.IPeerService; req }): { data: { suspended: boolean } } {
    return {
        data: { suspended: service.getStorage().hasSuspendedPeer(req.data.remoteAccess) },
    };
}

export function getSuspendedPeers({ service }: { service: P2P.IPeerService }): { data: P2P.IPeerSuspension[] } {
    return {
        data: service.getStorage().getSuspendedPeers(),
    };
}

export function getConfig(): { data: Record<string, any> } {
    return { data: app.resolveOptions("p2p") };
}
