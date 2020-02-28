import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { isWhitelisted } from "../../utils/is-whitelisted";
import * as internalHandlers from "./internal";
import * as peerHandlers from "./peer";

export const isAppReady = ({ app }: { app: Contracts.Kernel.Application }): { ready: boolean } => {
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

export const log = ({ app, req }: { app: Contracts.Kernel.Application; req: any }): void =>
    app.log[req.data.level](req.data.message);

export const isForgerAuthorized = ({
    app,
    req,
}: {
    app: Contracts.Kernel.Application;
    req: any;
}): { authorized: boolean } => {
    const configuration = app.getTagged<Providers.PluginConfiguration>(
        Container.Identifiers.PluginConfiguration,
        "plugin",
        "@arkecosystem/core-p2p",
    );
    const authorized = isWhitelisted(configuration.getOptional<string[]>("remoteAccess", []), req.data.ip);
    return { authorized };
};

export const getConfig = ({ app }: { app: Contracts.Kernel.Application }): Record<string, any> => {
    const configuration = app
        .getTagged<Providers.PluginConfiguration>(
            Container.Identifiers.PluginConfiguration,
            "plugin",
            "@arkecosystem/core-p2p",
        )
        .all();

    // add maxTransactionsPerRequest config from transaction pool
    configuration.maxTransactionsPerRequest = app
        .getTagged<Providers.PluginConfiguration>(
            Container.Identifiers.PluginConfiguration,
            "plugin",
            "@arkecosystem/core-transaction-pool",
        )
        .getOptional<number>("maxTransactionsPerRequest", 40);

    return configuration;
};
