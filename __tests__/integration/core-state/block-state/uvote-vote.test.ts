import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions, Interfaces } from "@arkecosystem/crypto";
import { delegates } from "@arkecosystem/core-test-framework";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;
let stateStore: Contracts.State.StateStore;
let blockState: Contracts.State.BlockState;
let walletRepository: Contracts.State.WalletRepository;

let block1: Interfaces.IBlock;
let block2: Interfaces.IBlock;

beforeAll(async () => {
    app = await setUp();

    stateStore = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore);
    blockState = app.getTagged<Contracts.State.BlockState>(Container.Identifiers.BlockState, "state", "blockchain");
    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const unvoteVoteTransaction = Transactions.BuilderFactory.vote()
        .votesAsset([`-${delegates[10].publicKey}`, `+${delegates[10].publicKey}`])
        .nonce("3")
        .fee("100")
        .sign(delegates[10].passphrase)
        .build();

    const bip39 = new BIP39(delegates[0].passphrase);

    block1 = stateStore.getLastBlock();

    block2 = bip39.forge([unvoteVoteTransaction.data], {
        timestamp: block1.data.timestamp + 60,
        previousBlock: block1.data,
        reward: Utils.BigNumber.make("100"),
    });
});

afterAll(async () => {
    await tearDown();
});

describe("BlockState handling unvote+vote transaction", () => {
    it("should apply block#2 containing single unvote+vote transaction", async () => {
        const delegate10 = walletRepository.findByPublicKey(delegates[10].publicKey);

        expect(delegate10.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

        await blockState.applyBlock(block2);

        expect(delegate10.getAttribute("delegate.voteBalance").toFixed()).toBe("299999999999900");
    });

    it("should revert block#2 containing single unvote+vote transaction", async () => {
        const delegate10 = walletRepository.findByPublicKey(delegates[10].publicKey);

        await blockState.revertBlock(block2);

        expect(delegate10.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    });
});
