import "jest-extended";

import { Container, Providers, Services } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

import { Managers, Utils } from "@arkecosystem/crypto";
import { defaults } from "../../../packages/core-state/src/defaults";
import { StateStore } from "../../../packages/core-state/src/stores/state";
import { BlockState } from "../../../packages/core-state/src/block-state";
import { WalletRepository, TempWalletRepository } from "../../../packages/core-state/src/wallets";
import { registerIndexers, registerFactories } from "../../../packages/core-state/src/wallets/indexers";
import { DposState } from "../../../packages/core-state/src/dpos/dpos";
import { PluginConfiguration } from "@arkecosystem/core-kernel/dist/providers";
import { dposPreviousRoundStateProvider } from "../../../packages/core-state/src";
import { DposPreviousRoundStateProvider } from "@arkecosystem/core-kernel/dist/contracts/state";
import { StateBuilder } from "@arkecosystem/core-state/src/state-builder";
import { TransactionValidator } from "@arkecosystem/core-state/src/transaction-validator";

export interface Spies {
    applySpy: jest.SpyInstance,
    revertSpy: jest.SpyInstance,
    logger: {
        error: jest.SpyInstance,
        info: jest.SpyInstance,
        debug: jest.SpyInstance,
    },
    getBlockRewardsSpy: jest.SpyInstance,
    getSentTransactionSpy: jest.SpyInstance,
    getRegisteredHandlersSpy: jest.SpyInstance,
    dispatchSpy: jest.SpyInstance,
}

export interface Setup {
    sandbox: Sandbox;
    walletRepo: WalletRepository;
    tempWalletRepo: TempWalletRepository;
    factory: FactoryBuilder;
    blockState: BlockState;
    stateStore: StateStore;
    dPosState: DposState;
    dposPreviousRound: DposPreviousRoundStateProvider;
    stateBuilder: StateBuilder;
    transactionValidator: TransactionValidator;
    spies: Spies
}

export const setUpDefaults = {
    getSentTransaction: {
        senderPublicKey: "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece",
        amount: Utils.BigNumber.make(22222),
        fee: Utils.BigNumber.make(33333),
        nonce: Utils.BigNumber.ONE,
    },
    getBlockRewards: {
        generatorPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        rewards: Utils.BigNumber.make(10000),
    },        
    getRegisteredHandlers: [],
}

export const setUp = (setUpOptions = setUpDefaults): Setup => {
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
        .set("delegate.rank");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.round");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc.locks");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc.lockedBalance");

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
        .get<PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastBlocks", defaults.storage.maxLastBlocks);

    sandbox.app
        .get<PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastTransactionIds", defaults.storage.maxLastTransactionIds);

    sandbox.app
        .bind(Container.Identifiers.StateStore)
        .to(StateStore)
        .inSingletonScope();
    
    const stateStore: StateStore = sandbox.app
        .get(Container.Identifiers.StateStore);

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
    const debug: jest.SpyInstance = jest.fn();
    
    const logger = {
        error,
        info,
        debug,
    };

    sandbox.app
        .bind(Container.Identifiers.LogService)
        .toConstantValue(logger);

    const getRegisteredHandlersSpy = jest.fn();

    @Container.injectable()
    class MockHandler {
        public getActivatedHandlerForData() {
            return {
                apply: applySpy,
                revert: revertSpy,
            };
        }
        public getRegisteredHandlers() {
            getRegisteredHandlersSpy();
            return setUpOptions.getRegisteredHandlers;
        }
    }

    sandbox.app
        .bind(Container.Identifiers.TransactionHandlerRegistry)
        .to(MockHandler);

    const getBlockRewardsSpy = jest.fn();

    @Container.injectable()
    class MockBlockRepository {
        public getBlockRewards() {
            getBlockRewardsSpy();
            return [setUpOptions.getBlockRewards];
        }
    }

    const getSentTransactionSpy = jest.fn();

    @Container.injectable()
    class MockTransactionRepository {
        public getSentTransactions() {
            getSentTransactionSpy();
            return [setUpOptions.getSentTransaction];
        }
    }

    const dispatchSpy = jest.fn();

    @Container.injectable()
    class MockEventDispatcher {
        public dispatch(data) {
            return dispatchSpy(data);
        }
    }

    sandbox.app.container.bind(Container.Identifiers.BlockRepository).to(MockBlockRepository);
    sandbox.app.container.bind(Container.Identifiers.TransactionRepository).to(MockTransactionRepository);
    sandbox.app.container.bind(Container.Identifiers.EventDispatcherService).to(MockEventDispatcher);

    sandbox.app
        .bind(Container.Identifiers.BlockState)
        .to(BlockState);

    sandbox.app
        .bind(Container.Identifiers.DposState)
        .to(DposState)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

    sandbox.app
        .bind(Container.Identifiers.DposState)
        .to(DposState)
        .inRequestScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "temp"));
  
    sandbox.app
        .bind<DposPreviousRoundStateProvider>(Container.Identifiers.DposPreviousRoundStateProvider)
        .toProvider(dposPreviousRoundStateProvider);

    const dposPreviousRound = sandbox.app
        .get<DposPreviousRoundStateProvider>(Container.Identifiers.DposPreviousRoundStateProvider);

    const blockState = sandbox.app
        .get<BlockState>(Container.Identifiers.BlockState);

    const dPosState = sandbox.app
        .getTagged<DposState>(Container.Identifiers.DposState, "state", "blockchain");


    sandbox.app
        .bind(Container.Identifiers.TransactionValidator)
        .to(TransactionValidator);

    const transactionValidator: TransactionValidator = sandbox.app
        .get(Container.Identifiers.TransactionValidator);

    const stateBuilder = sandbox.app.resolve<StateBuilder>(StateBuilder);

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
        stateStore,
        dPosState,
        dposPreviousRound,
        stateBuilder,
        transactionValidator,
        spies: {
            applySpy,
            revertSpy,
            logger,
            getBlockRewardsSpy,
            getSentTransactionSpy,
            getRegisteredHandlersSpy,
            dispatchSpy,
        }
    }
}
