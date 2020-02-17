import "jest-extended";
import { Container, Contracts, Services, Providers } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";

import { Managers } from "@arkecosystem/crypto";
import { defaults } from "../../../../packages/core-state/src/defaults";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { WalletRepository, Wallet } from "@arkecosystem/core-state/src/wallets";
import { registerIndexers } from "../../../../packages/core-state/src/wallets/indexers";

let sandbox: Sandbox;

beforeAll(() => {
    sandbox = new Sandbox();

    registerIndexers(sandbox.app);

    sandbox.app
        .bind(Container.Identifiers.WalletFactory)
        .toFactory<Contracts.State.Wallet>((context: Container.interfaces.Context) => (address: string) =>
            new Wallet(
                address,
                new Services.Attributes.AttributeMap(
                    context.container.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
                ),
            ),
        );

    sandbox.app
        .bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .inSingletonScope();

    sandbox.app
        .get<any>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastBlocks", defaults.storage.maxLastBlocks);

    sandbox.app
        .get<any>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastTransactionIds", defaults.storage.maxLastTransactionIds);

    sandbox.app
        .bind(Container.Identifiers.StateStore)
        .to(StateStore)
        .inSingletonScope();
    
    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(WalletRepository);

    const walletRepository = sandbox.app
        .get<any>(Container.Identifiers.WalletRepository);

    Managers.configManager.setFromPreset("testnet");
});

describe("Wallet Repository", () => {
    it("...", () => {

    });
});