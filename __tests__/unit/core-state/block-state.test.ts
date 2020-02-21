import "jest-extended";
import { Container, Providers, Services } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

import { Blocks, Managers, Utils, Transactions } from "@arkecosystem/crypto";
import { defaults } from "../../../packages/core-state/src/defaults";
import { StateStore } from "../../../packages/core-state/src/stores/state";
import { BlockState } from "../../../packages/core-state/src/block-state";
import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { registerIndexers, registerFactories } from "../../../packages/core-state/src/wallets/indexers";
import { IBlock, ITransaction } from "@arkecosystem/crypto/dist/interfaces";

let { BlockFactory } = Blocks;
let sandbox: Sandbox;
let blockState: BlockState;
let factory: FactoryBuilder;
let blocks: IBlock[];
let walletRepo: WalletRepository;

// TODO: Sandbox initialisation is the same everytime - pull this out
beforeAll(() => {
    sandbox = new Sandbox();

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
    
    // TODO: check this is needed
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.votebalance");

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
        .inSingletonScope(); // TODO: these should probably all be intialised this way, in fact - this whole set up should be pulled out

    walletRepo = sandbox.app
        .get(Container.Identifiers.WalletRepository);

    const logger = {
        error: jest.fn(),
    };
    
    sandbox.app
        .bind(Container.Identifiers.LogService)
        .toConstantValue(logger);

    jest.spyOn(logger, "error"); // const spy = j

    @Container.injectable()
    class MockHandler {
        public getActivatedHandlerForData() {
            // this should be a method that returns a transaction handler
            // this transaction handler should have a method on it to that we want to test too
            return {
                apply: () => { console.log("Apply called") },
                revert: () => { console.log("Revert called") },
            };
        }
    }

    sandbox.app
        .bind(Container.Identifiers.TransactionHandlerRegistry)
        .to(MockHandler)

    sandbox.app
        .bind(Container.Identifiers.BlockState)
        .to(BlockState);

    blockState = sandbox.app
        .get<any>(Container.Identifiers.BlockState);

    factory = new FactoryBuilder();

    Factories.registerBlockFactory(factory);

    Factories.registerTransactionFactory(factory);

    Managers.configManager.setFromPreset("testnet");
});

beforeEach(() => {
    // TODO: is is better to use core-test-framework Transaction builder instead?
    const txs: ITransaction[] = [];
    for (let i = 0; i < 3; i++) {
        txs[i] = Transactions.BuilderFactory.vote()
            .sign(Math.random().toString(36))
            .votesAsset([`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`])
            .build();
    }

    // TODO: pull this out into helper
    const makeChainedBlocks = (length: number, blockFactory): IBlock[] => {
        const entitites: IBlock[] = [];
        let previousBlock; // first case uses genesis IBlockData
        const getPreviousBlock = () => previousBlock;

        for (let i = 0; i < length; i++) {
            if (previousBlock) {
                blockFactory.withOptions({getPreviousBlock}); // TODO: could add transactions in here, instead of setting them on the block object below (in tests)
            }
            const entity: IBlock = blockFactory.make();
            entitites.push(entity);
            previousBlock = entity.data;
        }
        return entitites;
    }
    blocks = makeChainedBlocks(101, factory.get("Block"));

    walletRepo.reset();
});

describe("BlockState", () => {
    beforeEach(() => {
        const generatorWallet = walletRepo.findByPublicKey(blocks[0].data.generatorPublicKey);

        generatorWallet.setAttribute("delegate", {
            username: "test",
            forgedFees: Utils.BigNumber.ZERO,
            forgedRewards: Utils.BigNumber.ZERO,
            producedBlocks: 0,
            lastBlock: undefined,
        });

        walletRepo.reindex(generatorWallet);
    });

    it("should apply sequentially the transactions of the block", async () => {
        
        const txs: ITransaction[] = [];
        for (let i = 0; i < 3; i++) {
            txs[i] = Transactions.BuilderFactory.vote()
                .sign(Math.random().toString(36))
                .votesAsset([`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`])
                .build();
        }

        const { data } = blocks[0];
        data.transactions = [];
        data.transactions.push(txs[0].data);
        data.transactions.push(txs[1].data);
        data.transactions.push(txs[2].data);
        data.numberOfTransactions = 3; // NOTE: if transactions are added to a fixture the NoT needs to be increased
        const madeBlock = BlockFactory.fromData(data);

        await blockState.applyBlock(madeBlock);

        for (let i = 0; i < madeBlock.transactions.length; i++) {
            expect(blockState.applyTransaction).toHaveBeenNthCalledWith(i + 1, madeBlock.transactions[i]);
        }
    });
});