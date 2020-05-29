import "jest-extended";

import { initApp, parseObjectWithBigInt } from "../__support__";
import { TransactionResource } from "../../../../packages/core-api/src/resources";
import { CryptoSuite } from "../../../../packages/core-crypto";
import { Application } from "../../../../packages/core-kernel";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { Interfaces } from "../../../../packages/crypto";

let app: Application;
let resource: TransactionResource;

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

beforeEach(() => {
    app = initApp(crypto);

    resource = app.resolve<TransactionResource>(TransactionResource);
});

describe("TransactionResource", () => {
    let transferTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        transferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase(passphrases[1]))
            .amount("1")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        transferTransaction.data.nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1");
    });

    describe("raw", () => {
        it("should return raw object", async () => {
            const result = <any>resource.raw(transferTransaction.data);

            const expectedResult = parseObjectWithBigInt(transferTransaction.data);
            delete expectedResult.typeGroup;

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            const result = <any>resource.transform(transferTransaction.data);

            const expectedResult = parseObjectWithBigInt(transferTransaction.data);
            expectedResult.confirmations = 0;
            delete expectedResult.expiration;
            delete expectedResult.network;
            delete expectedResult.timestamp;
            delete expectedResult.recipientId;

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });
    });
});
