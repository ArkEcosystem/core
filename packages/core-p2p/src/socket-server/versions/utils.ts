import { app, Container, Providers } from "@arkecosystem/core-kernel";

import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export const isAppReady = (): { ready: boolean } => {
    return {
        ready:
            app.isBound(Container.Identifiers.TransactionPoolService) &&
            app.isBound(Container.Identifiers.BlockchainService) &&
            app.isBound(Container.Identifiers.PeerNetworkMonitor),
    };
};

export const getHandlers = (): { [key: string]: string[] } => ({
    peer: Object.keys(peerHandlers),
    internal: Object.keys(internalHandlers),
});

export const log = ({ req }): void => app.log[req.data.level](req.data.message);

export const isForgerAuthorized = ({ req }): { authorized: boolean } => ({
    authorized: isWhitelisted(
        app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-p2p")
            .config()
            .get<string[]>("remoteAccess"),
        req.data.ip,
    ),
});

export const getConfig = (): Record<string, any> =>
    app
        .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
        .get("@arkecosystem/core-p2p")
        .config()
        .all();
