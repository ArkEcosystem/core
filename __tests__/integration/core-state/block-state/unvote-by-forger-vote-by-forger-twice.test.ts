import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions } from "@arkecosystem/crypto";
import { delegates } from "@arkecosystem/core-test-framework";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

import { setUp, tearDown } from "../__support__/setup";
import { getActualVoteBalances, getExpectedVoteBalances } from "../__support__/utils";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

test("BlockState handling [unvote by forger, vote by forger, unvote by forger, vote by forger] block", async () => {
    const stateStore = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore);

    const blockState = app.getTagged<Contracts.State.BlockState>(
        Container.Identifiers.BlockState,
        "state",
        "blockchain",
    );

    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const unvoteTransaction1 = Transactions.BuilderFactory.vote()
        .votesAsset([`-${delegates[1].publicKey}`])
        .nonce("3")
        .fee("1")
        .sign(delegates[1].passphrase)
        .build();

    const voteTransaction2 = Transactions.BuilderFactory.vote()
        .votesAsset([`+${delegates[2].publicKey}`])
        .nonce("4")
        .fee("2")
        .sign(delegates[1].passphrase)
        .build();

    const unvoteTransaction3 = Transactions.BuilderFactory.vote()
        .votesAsset([`-${delegates[2].publicKey}`])
        .nonce("5")
        .fee("3")
        .sign(delegates[1].passphrase)
        .build();

    const voteTransaction4 = Transactions.BuilderFactory.vote()
        .votesAsset([`+${delegates[3].publicKey}`])
        .nonce("6")
        .fee("4")
        .sign(delegates[1].passphrase)
        .build();

    const bip39 = new BIP39(delegates[1].passphrase);

    const block1 = stateStore.getLastBlock();

    const block2 = bip39.forge(
        [unvoteTransaction1.data, voteTransaction2.data, unvoteTransaction3.data, voteTransaction4.data],
        {
            timestamp: block1.data.timestamp + 60,
            previousBlock: block1.data,
            reward: Utils.BigNumber.make("100"),
        },
    );

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));

    await blockState.applyBlock(block2);

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));

    await blockState.revertBlock(block2);

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));
});
