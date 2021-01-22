import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions } from "@arkecosystem/crypto";
import { delegates } from "@arkecosystem/core-test-framework";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

test("BlockState handling [unvote by forger], [vote by forger] blocks", async () => {
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

    const unvoteTransaction = Transactions.BuilderFactory.vote()
        .votesAsset([`-${delegates[1].publicKey}`])
        .nonce("3")
        .fee("10")
        .sign(delegates[1].passphrase)
        .build();

    const voteTransaction = Transactions.BuilderFactory.vote()
        .votesAsset([`+${delegates[2].publicKey}`])
        .nonce("4")
        .fee("20")
        .sign(delegates[1].passphrase)
        .build();

    const bip39 = new BIP39(delegates[1].passphrase);

    const block1 = stateStore.getLastBlock();

    const block2 = bip39.forge([unvoteTransaction.data], {
        timestamp: block1.data.timestamp + 60,
        previousBlock: block1.data,
        reward: Utils.BigNumber.make("100"),
    });

    const block3 = bip39.forge([voteTransaction.data], {
        timestamp: block2.data.timestamp + 60,
        previousBlock: block2.data,
        reward: Utils.BigNumber.make("200"),
    });

    const delegate1 = walletRepository.findByPublicKey(delegates[1].publicKey);
    const delegate2 = walletRepository.findByPublicKey(delegates[2].publicKey);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.applyBlock(block2);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("0");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.applyBlock(block3);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("0");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("600000000000300");

    await blockState.revertBlock(block3);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("0");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.revertBlock(block2);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
});
