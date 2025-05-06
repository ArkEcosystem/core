import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";

const genesisPassphrase: string = secrets[0];

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Bls Public Key Registration", () => {
    describe("Signed with 1 Passphase", () => {
        it("should broadcast, accept and forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.initialize(app)
                .delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Register bls public key
            const transactionsResign = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "a".repeat(96),
                })
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsResign.id).toBeForged();
        });
    });

    describe("Signed with 2 Passphases", () => {
        it("should broadcast, accept and forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.initialize(app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.initialize(app)
                .delegateRegistration()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Register bls public key
            const transactionsResign = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "a".repeat(96),
                })
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsResign).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsResign.id).toBeForged();
        });
    });
});
