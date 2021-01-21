import { createHash } from "crypto";
import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions } from "@arkecosystem/crypto";
import { Repositories } from "@arkecosystem/core-database";
import { delegates } from "@arkecosystem/core-test-framework";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

import { setUp, tearDown } from "../__support__/setup";
import { HtlcLockExpirationType } from "@arkecosystem/crypto/dist/enums";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

test("BlockState handling [lock], [claim] blocks", async () => {
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

    const transactionRepository = app.get<Repositories.TransactionRepository>(
        Container.Identifiers.DatabaseTransactionRepository,
    );

    const lockSecret = Buffer.from("a".repeat(32), "utf-8");
    const lockSecretHash = createHash("sha256").update(lockSecret).digest();

    const lockTransaction = Transactions.BuilderFactory.htlcLock()
        .htlcLockAsset({
            expiration: { type: HtlcLockExpirationType.BlockHeight, value: 2 },
            secretHash: lockSecretHash.toString("hex"),
        })
        .recipientId(delegates[3].address)
        .amount("100")
        .nonce("3")
        .fee("100")
        .sign(delegates[2].passphrase)
        .build();

    const refundTransaction = Transactions.BuilderFactory.htlcRefund()
        .htlcRefundAsset({
            lockTransactionId: lockTransaction.id,
        })
        .nonce("4")
        .fee("0")
        .sign(delegates[2].passphrase)
        .build();

    const bip39 = new BIP39(delegates[1].passphrase);

    const block1 = stateStore.getLastBlock();

    const block2 = bip39.forge([lockTransaction.data], {
        timestamp: block1.data.timestamp + 60,
        previousBlock: block1.data,
        reward: Utils.BigNumber.make("100"),
    });

    const block3 = bip39.forge([refundTransaction.data], {
        timestamp: block2.data.timestamp + 60,
        previousBlock: block2.data,
        reward: Utils.BigNumber.make("100"),
    });

    const delegate1 = walletRepository.findByPublicKey(delegates[1].publicKey);
    const delegate2 = walletRepository.findByPublicKey(delegates[2].publicKey);
    const delegate3 = walletRepository.findByPublicKey(delegates[3].publicKey);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.applyBlock(block2);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000200");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("299999999999900");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.applyBlock(block3);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000300");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("299999999999900");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    jest.spyOn(transactionRepository, "findByIds").mockResolvedValueOnce([lockTransaction.data as any]);

    await blockState.revertBlock(block3);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000200");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("299999999999900");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.revertBlock(block2);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
});
