import "jest-extended";

import { Container, Providers, Services } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

import { Managers } from "@arkecosystem/crypto";
import { defaults } from "../../../packages/core-state/src/defaults";
import { StateStore } from "../../../packages/core-state/src/stores/state";
import { BlockState } from "../../../packages/core-state/src/block-state";
import { WalletRepository, TempWalletRepository } from "../../../packages/core-state/src/wallets";
import { registerIndexers, registerFactories } from "../../../packages/core-state/src/wallets/indexers";

export interface Spies {
    applySpy: jest.SpyInstance,
    revertSpy: jest.SpyInstance,
    logger: {
        error: jest.SpyInstance,
        info: jest.SpyInstance
    }
}

export interface Setup {
    sandbox: Sandbox;
    walletRepo: WalletRepository;
    tempWalletRepo: TempWalletRepository;
    factory: FactoryBuilder;
    blockState: BlockState;
    spies: Spies
}

export const setUp = (): Setup => {
    const sandbox = new Sandbox();

    sandbox.app
        .bind(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.username");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.voteBalance");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("vote");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.resigned");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc.locks");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("ipfs");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("ipfs.hashes");

    registerIndexers(sandbox.app);
    registerFactories(sandbox.app);

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
        .to(WalletRepository)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(TempWalletRepository)
        .inRequestScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "temp"));

    const tempWalletRepo: TempWalletRepository = sandbox.app
        .getTagged(Container.Identifiers.WalletRepository, "state", "temp");

    const walletRepo: WalletRepository = sandbox.app
        .getTagged(Container.Identifiers.WalletRepository, "state", "blockchain");

    const applySpy: jest.SpyInstance = jest.fn();
    const revertSpy: jest.SpyInstance = jest.fn();
    const error: jest.SpyInstance = jest.fn();
    const info: jest.SpyInstance = jest.fn();

    const logger = {
        error,
        info
    };

    sandbox.app
        .bind(Container.Identifiers.LogService)
        .toConstantValue(logger);

    @Container.injectable()
    class MockHandler {
        public getActivatedHandlerForData() {
            return {
                apply: applySpy,
                revert: revertSpy,
            };
        }
    }

    sandbox.app
        .bind(Container.Identifiers.TransactionHandlerRegistry)
        .to(MockHandler)

    sandbox.app
        .bind(Container.Identifiers.BlockState)
        .to(BlockState);

    const blockState = sandbox.app
        .get<any>(Container.Identifiers.BlockState);

    const factory = new FactoryBuilder();

    Factories.registerBlockFactory(factory);
    Factories.registerTransactionFactory(factory);
    Factories.registerWalletFactory(factory);

    Managers.configManager.setFromPreset("testnet");

    return {
        sandbox,
        walletRepo,
        tempWalletRepo,
        factory,
        blockState,
        spies: {
            applySpy,
            revertSpy,
            logger,
        }
    }
}
