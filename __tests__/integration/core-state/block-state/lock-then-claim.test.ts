import { createHash } from "crypto";
import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions, Identities, Enums } from "@arkecosystem/crypto";
import { Repositories } from "@arkecosystem/core-database";
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
            expiration: { type: Enums.HtlcLockExpirationType.BlockHeight, value: 3 },
            secretHash: lockSecretHash.toString("hex"),
        })
        .recipientId(Identities.Address.fromPublicKey(delegates[3].publicKey))
        .amount("100")
        .nonce("3")
        .fee("100")
        .sign(delegates[2].passphrase)
        .build();

    const claimTransaction = Transactions.BuilderFactory.htlcClaim()
        .htlcClaimAsset({
            lockTransactionId: lockTransaction.id,
            unlockSecret: lockSecret.toString("hex"),
        })
        .nonce("3")
        .fee("0")
        .sign(delegates[3].passphrase)
        .build();

    const bip39 = new BIP39(delegates[1].passphrase);

    const block1 = stateStore.getLastBlock();

    const block2 = bip39.forge([lockTransaction.data], {
        timestamp: block1.data.timestamp + 60,
        previousBlock: block1.data,
        reward: Utils.BigNumber.make("100"),
    });

    const block3 = bip39.forge([claimTransaction.data], {
        timestamp: block2.data.timestamp + 60,
        previousBlock: block2.data,
        reward: Utils.BigNumber.make("100"),
    });

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));

    await blockState.applyBlock(block2);

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));

    await blockState.applyBlock(block3);

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));

    jest.spyOn(transactionRepository, "findByIds").mockResolvedValueOnce([lockTransaction.data as any]);

    await blockState.revertBlock(block3);

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));

    await blockState.revertBlock(block2);

    expect(getActualVoteBalances(walletRepository)).toEqual(getExpectedVoteBalances(walletRepository));
});
