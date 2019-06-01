import "jest-extended";

import "./mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";

// @ts-ignore
import { Constants, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Connection } from "../../../packages/core-transaction-pool/src/connection";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates } from "../../utils/fixtures/testnet/delegates";

let connection: Connection;
let memory: Memory;
let poolWalletManager: WalletManager;
let databaseWalletManager: Wallets.WalletManager;

beforeAll(async () => {
    Managers.configManager.setFromPreset("testnet");

    memory = new Memory();
    poolWalletManager = new WalletManager();
    connection = new Connection({
        options: defaults,
        walletManager: poolWalletManager,
        memory,
        storage: new Storage(),
    });

    await connection.make();

    jest.spyOn(Transactions.Verifier, "verify").mockReturnValue(true);
});

const mockCurrentHeight = (height: number) => {
    // @ts-ignore
    jest.spyOn(memory, "currentHeight").mockReturnValue(height);
    Managers.configManager.setHeight(height);
};

beforeEach(() => {
    mockCurrentHeight(1);

    connection.flush();
    poolWalletManager.reset();

    databaseWalletManager = new Wallets.WalletManager();

    for (let i = 0; i < delegates.length; i++) {
        const { publicKey } = delegates[i];
        const wallet = databaseWalletManager.findByPublicKey(publicKey);
        wallet.balance = Utils.BigNumber.make(100_000 * Constants.ARKTOSHI);
        wallet.username = `delegate-${i + 1}`;
        wallet.vote = publicKey;

        databaseWalletManager.reindex(wallet);
    }

    databaseWalletManager.buildDelegateRanking();
    databaseWalletManager.buildVoteBalances();

    // @ts-ignore
    connection.databaseService.walletManager = databaseWalletManager;
});

describe("Connection", () => {
    const addTransactionsToMemory = transactions => {
        for (const tx of transactions) {
            memory.remember(tx);
            expect(memory.has(tx.id)).toBeTrue();
        }
        expect(memory.count()).toBe(transactions.length);
    };

    describe("getTransactionsForForging", () => {
        it("should remove transactions that have expired [5 Good, 5 Bad]", () => {
            mockCurrentHeight(100);

            const transactions = TransactionFactory.transfer()
                .withCustomizedPayload([{ expiration: 1 }], { quantity: 5 })
                .build(10);

            addTransactionsToMemory(transactions);

            const forgingTransactions = connection.getTransactionsForForging(100);

            expect(forgingTransactions).toHaveLength(5);
            expect(forgingTransactions).toEqual(
                transactions.slice(5).map(({ serialized }) => serialized.toString("hex")),
            );
        });

        // it("should remove transactions that have a fee of 0 or less", () => {
        //     const transactions = [
        //         createTransfer({}),
        //         createTransfer({ amount: bignum(1234), fee: bignum(-2) }),
        //         createTransfer({ amount: bignum(2345), fee: bignum(0) }),
        //     ];

        //     addTransactionsToMemory(transactions);

        //     expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        // });

        // it("should remove transactions that have an amount of 0 or less", () => {
        //     const transactions = [
        //         createTransfer({}),
        //         createTransfer({ amount: bignum(-2) }),
        //         createTransfer({ amount: bignum(0) }),
        //     ];

        //     addTransactionsToMemory(transactions);

        //     expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        // });

        // it("should remove transactions that have data from another network", () => {
        //     const transactions = [
        //         createTransfer({}),
        //         createTransfer({
        //             recipientId: Identities.Address.fromPassphrase("this is fine", Networks.devnet.network.pubKeyHash),
        //         }),
        //     ];

        //     addTransactionsToMemory(transactions);

        //     expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        // });

        // it.skip("should remove transactions that have wrong sender public keys", () => {
        //     const transactions = [
        //         createTransfer({}),
        //         createTransfer({ senderPublicKey: Identities.PublicKey.fromPassphrase("this is wrong") }),
        //     ];

        //     expect(transactions[1]).toEqual({});
        //     addTransactionsToMemory(transactions);

        //     expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        // });

        // it.skip("should remove transactions that have timestamps in the future", () => {
        //     const transactions = [
        //         createTransfer({}),
        //         createTransfer({ amount: bignum(1234), timestamp: Crypto.Slots.getTime() + 100 * 1000 }),
        //     ];

        //     addTransactionsToMemory(transactions);

        //     expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        // });

        // it.skip("should remove transactions that have different IDs when entering and leaving", () => {
        //     const transactions = [createTransfer({}), createTransfer({ amount: bignum(1234), id: "64738638929" })];

        //     expect(transactions[1]).toEqual({});
        //     addTransactionsToMemory(transactions);

        //     expect(connection.getTransactionsForForging(100)).toEqual([transactions[0].serialized.toString("hex")]);
        // });

        it.todo("should remove transactions that have an unknown type");
        it.todo("should remove transactions that have unknown properties");
        it.todo("should remove transactions that have missing properties");
        it.todo("should remove transactions that have malformed properties");
        it.todo("should remove transactions that have malformed bytes");
        it.todo("should remove transactions that have additional bytes attached");
        it.todo("should remove transactions that have already been forged");
        it.todo("should remove transactions that have been persisted to the disk");
        it.todo("should remove transactions that have a disabled type");
        it.todo("should remove transactions that have have data of a another transaction type");
        it.todo("should remove transactions that have been altered after entering the pool");
        it.todo("should remove transactions that have negative numerical values");
        it.todo("should remove transactions that have malformed signatures");
        it.todo("should remove transactions that have malformed second signatures");
        it.todo("should remove transactions that have malformed multi signatures");
        it.todo("should remove transactions that fail to deserialize for unknown reasons");
        it.todo("should remove transactions that have a mismatch of expected and actual length of the vendor field");
        it.todo("should remove transactions that have an invalid vendor field length");
        it.todo("should remove transactions that have an invalid vendor field");
        it.todo("should remove transactions that have an invalid version");
    });
});
