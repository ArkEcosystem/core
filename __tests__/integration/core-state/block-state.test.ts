import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions } from "@arkecosystem/crypto";
import { delegates } from "@arkecosystem/core-test-framework";
import { BIP39 } from "../../../packages/core-forger/src/methods/bip39";

import { setUp, tearDown } from "./__support__/setup";

let app: Application;
let stateStore: Contracts.State.StateStore;
let blockState: Contracts.State.BlockState;
let walletRepository: Contracts.State.WalletRepository;

beforeAll(async () => {
    app = await setUp();

    stateStore = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore);

    blockState = app.getTagged<Contracts.State.BlockState>(Container.Identifiers.BlockState, "state", "blockchain");

    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );
});

afterAll(async () => {
    await tearDown();
});

describe("BlockState.applyBlock", () => {
    it("should apply block containing single unvote transaction", async () => {
        const unvoteTransaction = Transactions.BuilderFactory.vote()
            .votesAsset([`-${delegates[10].publicKey}`])
            .nonce("3")
            .fee("100")
            .sign(delegates[10].passphrase)
            .build();

        const bip39 = new BIP39(delegates[0].passphrase);
        const prevBlock = stateStore.getLastBlock();
        const nextBlock = bip39.forge([unvoteTransaction.data], {
            timestamp: prevBlock.data.timestamp + 60,
            previousBlock: prevBlock.data,
            reward: Utils.BigNumber.make("100"),
        });

        await blockState.applyBlock(nextBlock);

        const delegate10 = walletRepository.findByPublicKey(delegates[10].publicKey);

        expect(delegate10.getAttribute("delegate.voteBalance").toFixed()).toBe("0");
    });

    it("should apply next block containing single vote+unvote transaction", async () => {
        const voteUnvoteTransaction = Transactions.BuilderFactory.vote()
            .votesAsset([`+${delegates[10].publicKey}`, `-${delegates[10].publicKey}`])
            .nonce("4")
            .fee("100")
            .sign(delegates[10].passphrase)
            .build();

        const bip39 = new BIP39(delegates[0].passphrase);
        const prevBlock = stateStore.getLastBlock();
        const nextBlock = bip39.forge([voteUnvoteTransaction.data], {
            timestamp: prevBlock.data.timestamp + 60,
            previousBlock: prevBlock.data,
            reward: Utils.BigNumber.make("100"),
        });

        await blockState.applyBlock(nextBlock);

        const delegate10 = walletRepository.findByPublicKey(delegates[10].publicKey);

        expect(delegate10.getAttribute("delegate.voteBalance").toFixed()).toBe("0");
    });
});
