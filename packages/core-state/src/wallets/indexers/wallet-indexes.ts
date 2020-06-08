import { Container, Contracts, Services } from "@arkecosystem/core-kernel";

import { Wallet } from "../wallet";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    resignationsIndexer,
    usernamesIndexer,
} from "./indexers";

export const registerIndexers = (app: Contracts.Kernel.Application): void => {
    app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Addresses,
        indexer: addressesIndexer,
    });

    app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.PublicKeys,
        indexer: publicKeysIndexer,
    });

    app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Usernames,
        indexer: usernamesIndexer,
    });

    app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Resignations,
        indexer: resignationsIndexer,
    });

    app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Locks,
        indexer: locksIndexer,
    });

    app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Ipfs,
        indexer: ipfsIndexer,
    });
};

export const registerFactories = (app: Contracts.Kernel.Application): void => {
    if (!app.isBound(Container.Identifiers.WalletFactory)) {
        app.bind(Container.Identifiers.WalletFactory).toFactory<Contracts.State.Wallet>(
            (context: Container.interfaces.Context) => (address: string) =>
                new Wallet(
                    address,
                    new Services.Attributes.AttributeMap(
                        context.container.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
                    ),
                ),
        );
    }
};
