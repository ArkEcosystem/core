import "jest-extended";

import { bignumify, httpie } from "@arkecosystem/core-utils";
import { Address, PublicKey } from "@arkecosystem/crypto";
import delay from "delay";
import { generators } from "../utils";
import { secrets } from "../utils/config/testnet/delegates.json";
import { setUpContainer } from "../utils/helpers/container";

jest.setTimeout(1200000);

let app;
beforeEach(async () => {
    app = await setUpContainer({
        include: [
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-logger-pino",
            "@arkecosystem/core-database-postgres",
            "@arkecosystem/core-transaction-pool",
            "@arkecosystem/core-p2p",
            "@arkecosystem/core-blockchain",
            "@arkecosystem/core-api",
            "@arkecosystem/core-forger",
        ],
    });

    const databaseService = app.resolvePlugin("database");
    await databaseService.connection.roundsRepository.truncate();
    await databaseService.buildWallets();
    await databaseService.saveRound(
        secrets.map(secret => ({
            round: 1,
            publicKey: PublicKey.fromPassphrase(secret),
            voteBalance: bignumify("245098000000000"),
        })),
    );
});

afterEach(async () => {
    await app.tearDown();
});

describe("Transaction Forging", () => {
    it("should broadcast a transfer, accept it and forge it", async () => {
        // Sign
        const transactions = generators
            .generateTransfers("testnet", secrets[0], Address.fromPassphrase(secrets[0]), 2 * 1e8, 1, false, 10000000)
            .map(transaction => transaction.toJson());

        // Broadcast
        const responseBroadcast = await httpie.post("http://localhost:4003/api/v2/transactions", {
            body: {
                transactions,
            },
        });

        expect(responseBroadcast.body.data.accept).toContain(transactions[0].id);
        expect(responseBroadcast.body.data.broadcast).toContain(transactions[0].id);

        // Wait 1 block
        await delay(8000);

        // Verify
        const responseVerify = await httpie.get(`http://localhost:4003/api/v2/transactions/${transactions[0].id}`);
        expect(responseVerify.body.data.id).toBe(transactions[0].id);
    });

    it("should broadcast a second signature registration, accept it and forge it", async () => {
        // Sign
        const transactions = generators
            .generateSecondSignature("testnet", secrets[0], 1, false, 5 * 1e8)
            .map(transaction => transaction.toJson());

        // Broadcast
        const responseBroadcast = await httpie.post("http://localhost:4003/api/v2/transactions", {
            body: {
                transactions,
            },
        });

        expect(responseBroadcast.body.data.accept).toContain(transactions[0].id);
        expect(responseBroadcast.body.data.broadcast).toContain(transactions[0].id);

        // Wait 1 block
        await delay(8000);

        // Verify
        const responseVerify = await httpie.get(`http://localhost:4003/api/v2/transactions/${transactions[0].id}`);
        expect(responseVerify.body.data.id).toBe(transactions[0].id);
    });

    it("should broadcast a delegate registration, accept it and forge it", async () => {
        // Make a new wallet
        await httpie.post("http://localhost:4003/api/v2/transactions", {
            body: {
                transactions: generators
                    .generateTransfers(
                        "testnet",
                        secrets[0],
                        Address.fromPassphrase("secret"),
                        30 * 1e8,
                        1,
                        false,
                        10000000,
                    )
                    .map(transaction => transaction.toJson()),
            },
        });

        // Wait 1 block
        await delay(8000);

        // Sign
        const transactions = generators
            .generateDelegateRegistration("testnet", "secret", 1, false, "new_delegate", 25 * 1e8)
            .map(transaction => transaction.toJson());

        // Broadcast
        const responseBroadcast = await httpie.post("http://localhost:4003/api/v2/transactions", {
            body: {
                transactions,
            },
        });

        expect(responseBroadcast.body.data.accept).toContain(transactions[0].id);
        expect(responseBroadcast.body.data.broadcast).toContain(transactions[0].id);

        // Wait 1 block
        await delay(8000);

        // Verify
        const responseVerify = await httpie.get(`http://localhost:4003/api/v2/transactions/${transactions[0].id}`);
        expect(responseVerify.body.data.id).toBe(transactions[0].id);
    });
    it("should broadcast a vote registration, accept it and forge it", async () => {
        // Make a new wallet
        await httpie.post("http://localhost:4003/api/v2/transactions", {
            body: {
                transactions: generators
                    .generateTransfers(
                        "testnet",
                        secrets[0],
                        Address.fromPassphrase("secret"),
                        10 * 1e8,
                        1,
                        false,
                        10000000,
                    )
                    .map(transaction => transaction.toJson()),
            },
        });

        // Wait 1 block
        await delay(8000);

        // Sign
        const transactions = generators
            .generateVote("testnet", "secret", PublicKey.fromPassphrase(secrets[0]), 1, false, 1 * 1e8)
            .map(transaction => transaction.toJson());

        // Broadcast
        const responseBroadcast = await httpie.post("http://localhost:4003/api/v2/transactions", {
            body: {
                transactions,
            },
        });

        expect(responseBroadcast.body.data.accept).toContain(transactions[0].id);
        expect(responseBroadcast.body.data.broadcast).toContain(transactions[0].id);

        // Wait 1 block
        await delay(8000);

        // Verify
        const responseVerify = await httpie.get(`http://localhost:4003/api/v2/transactions/${transactions[0].id}`);
        expect(responseVerify.body.data.id).toBe(transactions[0].id);
    });
});
