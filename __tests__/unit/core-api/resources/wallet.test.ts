import "jest-extended";

import { WalletResource } from "@packages/core-api/src/resources";
import { CryptoSuite } from "@packages/core-crypto";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";

import { buildSenderWallet, initApp, parseObjectWithBigInt } from "../__support__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

let app: Application;
let resource: WalletResource;

beforeEach(() => {
    app = initApp(crypto);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
    resource = new WalletResource();
    // @ts-ignore
    resource.cryptoManager = crypto.CryptoManager;
});

afterEach(() => {
    try {
        crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
});

describe("WalletResource", () => {
    let senderWallet: Contracts.State.Wallet;

    beforeEach(() => {
        senderWallet = buildSenderWallet(app, crypto);
    });

    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(senderWallet)).toEqual(senderWallet);
        });
    });

    describe("transform", () => {
        let expectedResult: any;

        beforeEach(() => {
            expectedResult = expectedResult = {
                address: crypto.CryptoManager.Identities.Address.fromPassphrase(passphrases[0]),
                balance: "7527654310",
                isDelegate: false,
                isResigned: false,
                nonce: "0",
                publicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
            };
        });

        it("should return transformed object", async () => {
            expect(resource.transform(senderWallet)).toEqual(expect.objectContaining(expectedResult));
        });

        it("should return transformed object when contains additional attributes", async () => {
            senderWallet.setAttribute(
                "htlc.lockedBalance",
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(100),
            );
            expectedResult.lockedBalance = "100";

            senderWallet.setAttribute("delegate.username", "Dummy");
            expectedResult.isDelegate = true;
            expectedResult.username = "Dummy";

            senderWallet.setAttribute("delegate.resigned", true);
            expectedResult.isResigned = true;

            senderWallet.setAttribute(
                "vote",
                "+" + crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
            );
            expectedResult.vote = "+" + crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]);

            senderWallet.setAttribute("multiSignature", "dummy multiSignature");
            expectedResult.multiSignature = "dummy multiSignature";

            senderWallet.setAttribute(
                "secondPublicKey",
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
            );
            expectedResult.secondPublicKey = crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]);

            const result = parseObjectWithBigInt(resource.transform(senderWallet));

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });
    });
});
