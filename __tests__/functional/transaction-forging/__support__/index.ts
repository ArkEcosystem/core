import "jest-extended";

import { bignumify, httpie } from "@arkecosystem/core-utils";
import { configManager, PublicKey, transactionBuilder } from "@arkecosystem/crypto";
import delay from "delay";
import { generators } from "../../../utils";
import { secrets } from "../../../utils/config/testnet/delegates.json";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(1200000);

// @TODO: implement a flexible transaction builder

let app;
export async function setUp() {
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
}

export async function tearDown() {
    await app.tearDown();
}

export async function apiGET(path: string, opts?) {
    return httpie.get(`http://localhost:4003/api/v2/${path}`, opts);
}

export async function apiPOST(path: string, body) {
    return httpie.post(`http://localhost:4003/api/v2/${path}`, { body });
}

export async function snoozeForBlock(height: number = 1, extra: number = 0) {
    return delay(configManager.getMilestone(height).blocktime * 1000 + extra);
}

export async function broadcastTransactions(transactions) {
    return apiPOST("transactions", { transactions });
}

export async function expectAcceptAndBroadcast(transactions, id): Promise<void> {
    const { body } = await broadcastTransactions(transactions);

    expect(body.data.accept).toContain(id);
    expect(body.data.broadcast).toContain(id);
}

export async function expectTransactionForged(id): Promise<void> {
    const { body } = await apiGET(`transactions/${id}`);

    expect(body.data.id).toBe(id);
}

export function generateTransfer(passphrase, address: string, amount: number = 2, height: number = 1) {
    return generators
        .generateTransfer(
            "testnet",
            passphrase,
            address,
            amount * 1e8,
            1,
            false,
            configManager.getMilestone(height).fees.staticFees.transfer,
        )
        .map(transaction => transaction.toJson());
}

export function generateVote(passphrase, publicKey: string, height: number = 1) {
    return generators
        .generateVote(
            "testnet",
            passphrase,
            publicKey,
            1,
            false,
            configManager.getMilestone(height).fees.staticFees.vote,
        )
        .map(transaction => transaction.toJson());
}

export function generateSecondSignature(passphrase: string, secondPassphrase: string, height: number = 1) {
    return [
        transactionBuilder
            .secondSignature()
            .signatureAsset(secondPassphrase)
            .sign(passphrase)
            .getStruct(),
    ];

    // return generators,
    //     .generateSecondSignature(
    //         "testnet",
    //         passphrase,
    //         1,
    //         false,
    //         configManager.getMilestone(height).fees.staticFees.secondSignature,
    //     )
    //     .map(transaction => transaction.toJson());
}

export function generateDelegateRegistration(passphrase, username: string, height: number = 1) {
    return generators
        .generateDelegateRegistration(
            "testnet",
            passphrase,
            1,
            false,
            username,
            configManager.getMilestone(height).fees.staticFees.delegateRegistration,
        )
        .map(transaction => transaction.toJson());
}

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
