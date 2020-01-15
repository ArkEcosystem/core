/* tslint:disable:max-line-length no-empty */
import { database } from "../mocks/database";
import { state } from "../mocks/state";

import { State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Enums, Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Wallet, WalletManager } from "../../../../packages/core-state/src/wallets";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { htlcSecretHex, htlcSecretHashHex } from "../../../utils/fixtures";

jest.mock("@arkecosystem/core-container", () => require("../mocks/container").container);

const { EpochTimestamp } = Enums.HtlcLockExpirationType;

let walletManager: State.IWalletManager;

beforeAll(() => {
    Managers.configManager.getMilestone().aip11 = true;
    Managers.configManager.getMilestone().htlcEnabled = true;
    jest.spyOn(Handlers.Registry, "isKnownWalletAttribute").mockReturnValue(true);
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe("Wallet Manager", () => {
    describe("HTLC claim", () => {
        const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
        const lockKeys = Identities.Keys.fromPassphrase(lockPassphrase);
        const claimPassphrase = "fatal hat sail asset chase barrel pluck bag approve coral slab bright";
        const claimKeys = Identities.Keys.fromPassphrase(claimPassphrase);

        let lockWallet;
        let claimWallet;

        const initialLockWalletBalance = Utils.BigNumber.make(45 * 1e8);
        const initialDelegateWalletBalance = Utils.BigNumber.make(1000 * 1e8);

        beforeEach(() => {
            walletManager = new WalletManager();
            (database as any).walletManager = walletManager;

            lockWallet = new Wallet(Identities.Address.fromPublicKey(lockKeys.publicKey, 23));
            lockWallet.publicKey = lockKeys.publicKey;
            lockWallet.balance = initialLockWalletBalance;

            claimWallet = new Wallet(Identities.Address.fromPublicKey(claimKeys.publicKey, 23));
            claimWallet.publicKey = claimKeys.publicKey;

            walletManager.reindex(lockWallet);
            walletManager.reindex(claimWallet);

            state.getStore = () => ({
                getLastBlock: () => ({ data: { timestamp: Crypto.Slots.getTime() } }),
            });
        });

        describe("apply and revert transaction", () => {
            it("should update balance and vote balance when lock wallet votes for a delegate", async () => {
                // prepare htlc lock transaction
                const amount = 6 * 1e8;
                const htlcLockAsset = {
                    secretHash: htlcSecretHashHex,
                    expiration: {
                        type: EpochTimestamp,
                        value: Crypto.Slots.getTime() + 99,
                    },
                };
                const lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, claimWallet.address, amount)
                    .withPassphrase(lockPassphrase)
                    .withNonce(Utils.BigNumber.ONE)
                    .withFee(1e7)
                    .build(1)[0];

                // prepare claim transaction
                const htlcClaimAsset = {
                    lockTransactionId: lockTransaction.id,
                    unlockSecret: htlcSecretHex,
                };
                const claimTransaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                    .withPassphrase(claimPassphrase)
                    .build(1)[0];

                // lock wallet will vote for a delegate and we will check vote balance
                const delegateKeys = Identities.Keys.fromPassphrase("delegate");
                const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
                delegate.setAttribute("username", "unittest");
                delegate.balance = initialDelegateWalletBalance;
                delegate.setAttribute("vote", delegate.publicKey);
                delegate.setAttribute("delegate.voteBalance", delegate.balance);
                walletManager.reindex(delegate);

                const voteTransaction = Transactions.BuilderFactory.vote()
                    .votesAsset([`+${delegateKeys.publicKey}`])
                    .fee("125")
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();

                expect(lockWallet.balance).toEqual(initialLockWalletBalance);
                expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    Utils.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(Utils.BigNumber.ZERO);
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(initialDelegateWalletBalance);

                // apply vote
                await walletManager.applyTransaction(voteTransaction);

                const expectBeforeLockTx = () => {
                    expect(lockWallet.balance).toEqual(initialLockWalletBalance.minus(voteTransaction.data.fee));
                    expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                        Utils.BigNumber.ZERO,
                    );
                    expect(claimWallet.balance).toEqual(Utils.BigNumber.ZERO);
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance.plus(lockWallet.balance),
                    );
                };
                expectBeforeLockTx();

                await walletManager.applyTransaction(lockTransaction);

                const expectAfterLockTx = () => {
                    expect(lockWallet.balance).toEqual(
                        initialLockWalletBalance
                            .minus(voteTransaction.data.fee)
                            .minus(amount)
                            .minus(lockTransaction.data.fee),
                    );
                    expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                        Utils.BigNumber.make(amount),
                    );
                    expect(claimWallet.balance).toEqual(Utils.BigNumber.ZERO);
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance
                            .plus(lockWallet.balance)
                            .plus(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)),
                    );
                };
                expectAfterLockTx();

                await walletManager.applyTransaction(claimTransaction);

                expect(lockWallet.balance).toEqual(
                    initialLockWalletBalance
                        .minus(voteTransaction.data.fee)
                        .minus(amount)
                        .minus(lockTransaction.data.fee),
                );
                expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    Utils.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(Utils.BigNumber.make(amount).minus(claimTransaction.data.fee));
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                    initialDelegateWalletBalance
                        .plus(lockWallet.balance)
                        .plus(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)),
                );

                // mock findById to return lock transaction if correct id provided
                database.transactionsBusinessRepository.findById = id =>
                    id === lockTransaction.id ? lockTransaction.data : undefined;
                await walletManager.revertTransaction(claimTransaction);

                expectAfterLockTx();

                await walletManager.revertTransaction(lockTransaction);
                expectBeforeLockTx();
            });

            it("should update balance and vote balance when claim wallet votes for a delegate", async () => {
                // claim wallet will have some initial balance for voting
                const initialClaimWalletBalance = Utils.BigNumber.make(33 * 1e8);
                claimWallet.balance = initialClaimWalletBalance;
                walletManager.reindex(claimWallet);

                // prepare htlc lock transaction
                const amount = 6 * 1e8;
                const htlcLockAsset = {
                    secretHash: htlcSecretHashHex,
                    expiration: {
                        type: EpochTimestamp,
                        value: Crypto.Slots.getTime() + 99,
                    },
                };
                const lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, claimWallet.address, amount)
                    .withPassphrase(lockPassphrase)
                    .withFee(1e7)
                    .build(1)[0];

                // prepare claim transaction
                const htlcClaimAsset = {
                    lockTransactionId: lockTransaction.id,
                    unlockSecret: htlcSecretHex,
                };
                const claimTransaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                    .withPassphrase(claimPassphrase)
                    .withNonce(Utils.BigNumber.make(1))
                    .build(1)[0];

                // prepare vote transaction
                // claim wallet will vote for a delegate and we will check vote balance
                const delegateKeys = Identities.Keys.fromPassphrase("delegate");
                const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
                delegate.setAttribute("username", "unittest");
                delegate.balance = initialDelegateWalletBalance;
                delegate.setAttribute("vote", delegate.publicKey);
                delegate.setAttribute("delegate.voteBalance", delegate.balance);
                walletManager.reindex(delegate);

                const voteTransaction = Transactions.BuilderFactory.vote()
                    .votesAsset([`+${delegateKeys.publicKey}`])
                    .fee("125")
                    .nonce("1")
                    .sign(claimPassphrase)
                    .build();

                expect(lockWallet.balance).toEqual(initialLockWalletBalance);
                expect(lockWallet.getAttribute("htlc.", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
                expect(claimWallet.balance).toEqual(initialClaimWalletBalance);
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(initialDelegateWalletBalance);

                await walletManager.applyTransaction(voteTransaction);

                const expectBeforeLockTx = () => {
                    expect(lockWallet.balance).toEqual(initialLockWalletBalance);
                    expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                        Utils.BigNumber.ZERO,
                    );
                    expect(claimWallet.balance).toEqual(initialClaimWalletBalance.minus(voteTransaction.data.fee));
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance.plus(claimWallet.balance),
                    );
                };
                expectBeforeLockTx();

                await walletManager.applyTransaction(lockTransaction);

                const expectAfterLockTx = () => {
                    expect(lockWallet.balance).toEqual(
                        initialLockWalletBalance.minus(amount).minus(lockTransaction.data.fee),
                    );
                    expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                        Utils.BigNumber.make(amount),
                    );
                    expect(claimWallet.balance).toEqual(initialClaimWalletBalance.minus(voteTransaction.data.fee));
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance.plus(claimWallet.balance),
                    );
                };
                expectAfterLockTx();

                await walletManager.applyTransaction(claimTransaction);

                expect(lockWallet.balance).toEqual(
                    initialLockWalletBalance.minus(amount).minus(lockTransaction.data.fee),
                );
                expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    Utils.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(
                    initialClaimWalletBalance
                        .minus(voteTransaction.data.fee)
                        .plus(amount)
                        .minus(claimTransaction.data.fee),
                );
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                    initialDelegateWalletBalance.plus(claimWallet.balance),
                );

                // mock findById to return lock transaction if correct id provided
                database.transactionsBusinessRepository.findById = id =>
                    id === lockTransaction.id ? lockTransaction.data : undefined;
                await walletManager.revertTransaction(claimTransaction);

                expectAfterLockTx();

                await walletManager.revertTransaction(lockTransaction);
                expectBeforeLockTx();
            });
        });
    });

    describe("HTLC refund", () => {
        const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
        const lockKeys = Identities.Keys.fromPassphrase(lockPassphrase);

        let lockWallet;

        const initialLockWalletBalance = Utils.BigNumber.make(45 * 1e8);
        const initialDelegateWalletBalance = Utils.BigNumber.make(1000 * 1e8);

        beforeEach(() => {
            walletManager = new WalletManager();
            (database as any).walletManager = walletManager;

            lockWallet = new Wallet(Identities.Address.fromPublicKey(lockKeys.publicKey, 23));
            lockWallet.publicKey = lockKeys.publicKey;
            lockWallet.balance = initialLockWalletBalance;

            walletManager.reindex(lockWallet);

            state.getStore = () => ({
                getLastBlock: () => ({ data: { timestamp: Crypto.Slots.getTime() } }),
            });
        });

        describe("apply and revert transaction", () => {
            it("should update balance and vote balance when lock wallet votes for a delegate", async () => {
                lockWallet.nonce = Utils.BigNumber.ZERO;
                // prepare htlc lock transaction
                const amount = 6 * 1e8;
                const htlcLockAsset = {
                    secretHash: htlcSecretHashHex,
                    expiration: {
                        type: EpochTimestamp,
                        value: Crypto.Slots.getTime(),
                    },
                };
                const lockTransaction = TransactionFactory.htlcLock(
                    htlcLockAsset,
                    "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                    amount,
                )
                    .withPassphrase(lockPassphrase)
                    .withFee(1e7)
                    .withNonce(Utils.BigNumber.make(1))
                    .build(1)[0];

                // prepare refund transaction
                const htlcRefundAsset = {
                    lockTransactionId: lockTransaction.id,
                };
                const refundTransaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                    .withPassphrase(lockPassphrase)
                    .withNonce(Utils.BigNumber.make(2))
                    .build(1)[0];

                // lock wallet will vote for a delegate and we will check vote balance
                const delegateKeys = Identities.Keys.fromPassphrase("delegate");
                const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
                delegate.setAttribute("username", "unittest");
                delegate.balance = initialDelegateWalletBalance;
                delegate.setAttribute("vote", delegate.publicKey);
                delegate.setAttribute("delegate.voteBalance", delegate.balance);
                walletManager.reindex(delegate);

                const voteTransaction = Transactions.BuilderFactory.vote()
                    .votesAsset([`+${delegateKeys.publicKey}`])
                    .fee("125")
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();

                expect(lockWallet.balance).toEqual(initialLockWalletBalance);
                expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    Utils.BigNumber.ZERO,
                );
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(initialDelegateWalletBalance);

                await walletManager.applyTransaction(voteTransaction);

                const expectBeforeLockTx = () => {
                    expect(lockWallet.balance).toEqual(initialLockWalletBalance.minus(voteTransaction.data.fee));
                    expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                        Utils.BigNumber.ZERO,
                    );
                    expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toBeFalsy();
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance.plus(lockWallet.balance),
                    );
                };
                expectBeforeLockTx();

                state.getStore = () => ({
                    getLastBlock: () => ({ data: { timestamp: Crypto.Slots.getTime() - 8 } }),
                });

                await walletManager.applyTransaction(lockTransaction);

                const expectAfterLockTx = () => {
                    expect(lockWallet.balance).toEqual(
                        initialLockWalletBalance
                            .minus(voteTransaction.data.fee)
                            .minus(amount)
                            .minus(lockTransaction.data.fee),
                    );
                    expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                        Utils.BigNumber.make(amount),
                    );
                    expect(lockWallet.getAttribute("htlc.locks")[lockTransaction.id]).toBeTruthy();
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance
                            .plus(lockWallet.balance)
                            .plus(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)),
                    );
                };
                expectAfterLockTx();

                state.getStore = () => ({
                    getLastBlock: () => ({ data: { timestamp: Crypto.Slots.getTime() + 8 } }),
                });

                await walletManager.applyTransaction(refundTransaction);

                expect(lockWallet.balance).toEqual(
                    initialLockWalletBalance
                        .minus(voteTransaction.data.fee)
                        .minus(lockTransaction.data.fee)
                        .minus(refundTransaction.data.fee),
                );
                expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    Utils.BigNumber.ZERO,
                );
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                    initialDelegateWalletBalance
                        .plus(lockWallet.balance)
                        .plus(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)),
                );

                // mock findById to return lock transaction if correct id provided
                database.transactionsBusinessRepository.findById = id =>
                    id === lockTransaction.id ? lockTransaction.data : undefined;
                await walletManager.revertTransaction(refundTransaction);

                expectAfterLockTx();

                await walletManager.revertTransaction(lockTransaction);
                expectBeforeLockTx();
            });
        });
    });
});
